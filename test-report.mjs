// Generates a report from real data + real calc functions, as the Quick Check does.
import fs from 'node:fs'; import assert from 'node:assert';
import { calculate, matchBatteries, quickItems, solarNeeds } from './src/data/calc.js';
import { buildReport } from './src/data/report.js';
const J = f => JSON.parse(fs.readFileSync('src/data/' + f, 'utf8'));
const appliances = J('appliances.json').filter(a => a.running_w_max), batteries = J('batteries.json'), expansions = J('expansions.json'), programs = J('programs.json'), solar = J('solar.json');
const siteSrc = fs.readFileSync('src/data/site.js', 'utf8');
const hours = eval('(' + siteSrc.match(/DEFAULT_HOURS = (\{.*\});/)[1] + ')');
const priceLow = (s) => { const m = String(s||'').match(/\$([\d,]+(?:\.\d+)?)/); return m ? parseFloat(m[1].replace(/,/g,'')) : null; };
const items = quickItems('essentials', appliances, hours), h = 72, st = 'OH';
const r = calculate(items, h, 0.85), m = matchBatteries(r, batteries, priceLow, expansions);
const sys = m.systems[0], single = m.portable.filter(b => b.powerOk && b.fullCover && b.price != null).sort((a,b)=>a.price-b.price)[0];
const best = single && (!sys || single.price <= sys.totalPrice) ? { label: single.product, cap: single.capacity_kwh, price: single.price, url: single.source_url } : sys ? { label: `${sys.base.product} + ${sys.n} × ${sys.exp.battery}`, cap: sys.capacityKwh, price: sys.totalPrice, url: sys.exp.source_url } : null;
const report = { source: 'quickcheck', state: st, stateName: 'Ohio', hours: h, kwh: r.kwh, dailyKwh: r.dailyKwh, peakW: r.peakW, runningW: r.runningW, items: items.map(i => ({ name: i.name, qty: i.qty, hours: i.hours })), best, installed: m.installed.map(b => ({ label: `${b.units} × ${b.product}`, low: b.costLow, high: b.costHigh })), generator: m.generator, solarW: solarNeeds(r.dailyKwh, r.kwh, solar.assumptions.peak_sun_hours, solar.assumptions.derate).wattsToCoverDaily, asOf: '2026-10-25', rebates: programs.filter(p => p.state === st).slice(0, 5).map(p => ({ program: p.program, amounts: p.amounts, status: p.status, url: p.source_url })) };
const out = buildReport(report, { unsubscribeUrl: 'https://example.com/unsub' });
assert.ok(out.text.includes(r.kwh.toFixed(1) + ' kWh')); assert.ok(out.html.includes('Unsubscribe')); assert.ok(out.subject.includes('3 days'));
assert.throws(() => buildReport({ ...report, hours: -1 }));
fs.mkdirSync('screenshots', { recursive: true }); fs.writeFileSync('screenshots/sample-report.html', out.html); fs.writeFileSync('screenshots/sample-report.txt', out.text);
console.log(out.subject + '\n\n' + out.text);
