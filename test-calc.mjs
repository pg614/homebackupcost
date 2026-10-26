import { calculate, matchBatteries, quickItems, solarNeeds, QUICK_PRESETS } from './src/data/calc.js';
import fs from 'fs';
const A = JSON.parse(fs.readFileSync('src/data/appliances.json')); const B = JSON.parse(fs.readFileSync('src/data/batteries.json')); const E = JSON.parse(fs.readFileSync('src/data/expansions.json'));
const pl = (s) => { const m = String(s||'').match(/\$([\d,]+(?:\.\d+)?)/); return m ? parseFloat(m[1].replace(/,/g,'')) : null; };
const it = (n, hours, qty=1) => { const a = A.find(x=>x.appliance===n); return { name:n, runMin:a.running_w_min, runMax:a.running_w_max, startMax:a.starting_w_max, qty, hours }; };
const cases = {
 'Fridge+furnace fan+Wi-Fi, 24h': [[it('Refrigerator',8),it('Furnace fan 1/2 HP',8),it('Router/modem (Wi-Fi)',24)],24, {kwh:8.19, peak:2020, sys:['BLUETTI Apex 300',2,3657]}],
 'CPAP heated+Wi-Fi+charger, 24h': [[it('CPAP heated humidifier',8),it('Router/modem (Wi-Fi)',24),it('Phone/laptop charger',3)],24,{kwh:1.48,peak:240}],
 'Fridge+sump 1/3HP+Wi-Fi+6 LED, 72h': [[it('Refrigerator',8),it('Sump pump 1/3 HP',4.8),it('Router/modem (Wi-Fi)',24),it('LED bulb (each)',5,6)],72,{kwh:21.26,peak:2110}],
};
let fail=0;
for (const [k,[items,h,exp]] of Object.entries(cases)) {
  const r = calculate(items,h); const m = matchBatteries(r,B,pl,E);
  const ok = Math.abs(r.kwh-exp.kwh)<0.01 && r.peakW===exp.peak; if(!ok) fail++;
  console.log(`${ok?'PASS':'FAIL'} ${k}: kWh=${r.kwh.toFixed(2)} (raw ${r.rawKwh.toFixed(2)}) running=${r.runningW}W peak=${r.peakW}W | expected ${exp.kwh}/${exp.peak}`);
  console.log('   portable fit+full:', m.portable.filter(b=>b.powerOk&&b.fullCover).map(b=>`${b.product} $${b.price}`).join('; ')||'none', '| power-ok partial:', m.portable.filter(b=>b.powerOk&&!b.fullCover).map(b=>b.product+' '+b.coverPct+'%').join('; '));
  console.log('   expansion systems:', m.systems.map(s=>`${s.base.product} + ${s.n}x ${s.exp.battery} = ${s.capacityKwh.toFixed(2)} kWh, $${s.totalPrice}`).join(' | ')||'none');
  if (exp.sys) { const s=m.systems[0]; const ok2 = s && s.base.product===exp.sys[0] && s.n===exp.sys[1] && Math.abs(s.totalPrice-exp.sys[2])<0.01 && s.capacityKwh>=r.kwh; console.log(`   ${ok2?'PASS':'FAIL'} cheapest expansion system = ${exp.sys.join(' / ')}`); if(!ok2) fail++; }
  console.log('   installed:', m.installed.map(b=>`${b.units}x ${b.product} $${b.costLow}-$${b.costHigh}`).join('; '), '| generator', m.generator);
}

// ---- Quick Check presets: independent reference math vs calc.js ----
const HRS = { 'Refrigerator':8,'Freezer':8,'Furnace fan 1/2 HP':8,'Well pump 1/2 HP':1,'Window AC 10,000 BTU':8,'Microwave':0.5,'Washing machine':1,'TV 32-55in':4,'LED bulb (each)':5,'Phone/laptop charger':3,'CPAP heated humidifier':8,'Router/modem (Wi-Fi)':24 };
const ref = (key, h) => { let wh=0, run=0, surge=0; for (const [n,q] of QUICK_PRESETS[key]) { const a=A.find(x=>x.appliance===n); wh += (a.running_w_min+a.running_w_max)/2*q*HRS[n]; run += a.running_w_max*q; if (a.starting_w_max) surge=Math.max(surge,a.starting_w_max-a.running_w_max); } return { kwh: wh*(h/24)/1000/0.85, peak: run+surge }; };
const qc = [['essentials',24],['climate',72],['medical',24],['medical',168],['whole',24]];
for (const [key,h] of qc) {
  const r = calculate(quickItems(key,A,HRS),h); const e = ref(key,h); const m = matchBatteries(r,B,pl,E);
  const ok = Math.abs(r.kwh-e.kwh)<0.005 && r.peakW===e.peak; if(!ok) fail++;
  const single = m.portable.filter(b=>b.powerOk&&b.fullCover&&b.price!=null).sort((a,b)=>a.price-b.price)[0];
  console.log(`${ok?'PASS':'FAIL'} QuickCheck ${key} ${h}h: kWh=${r.kwh.toFixed(2)} peak=${r.peakW}W (ref ${e.kwh.toFixed(2)}/${e.peak}) | cheapest single: ${single?single.product+' $'+single.price:'none'} | cheapest system: ${m.systems[0]?`${m.systems[0].base.product}+${m.systems[0].n} $${m.systems[0].totalPrice}`:'none'}`);
}
// solarNeeds: 6.96 kWh/day at 4 PSH x 0.75 -> 2320 W -> rounded up to 2350 W; 1 x 400 W panel refills 8.19 kWh in 6.825 days
{ const s = solarNeeds(6.96, 8.19); const ok = s.wattsToCoverDaily===2350 && Math.abs(s.daysToRefill(400)-6.825)<0.001; if(!ok) fail++; console.log(`${ok?'PASS':'FAIL'} solarNeeds: ${s.wattsToCoverDaily} W, ${s.daysToRefill(400).toFixed(3)} days`); }
// ZIP → state spot checks
import { zipToState } from './src/data/zip.js';
for (const [z,st] of [['43215','OH'],['48201','MI'],['10001','NY'],['27601','NC'],['90012','CA'],['60601','IL'],['00000',null]]) { const g=zipToState(z); const ok=g===st; if(!ok) fail++; console.log(`${ok?'PASS':'FAIL'} zip ${z} -> ${g}`); }
process.exit(fail);
