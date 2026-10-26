// Builds the "email me my report" content from the user's actual calculator inputs/results.
// Shared by the browser (preview) and the Cloudflare Worker (the email itself). No DOM, no network.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
const num = (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const safeUrl = (u) => /^https:\/\/[^\s"<>]+$/.test(String(u || '')) ? String(u) : '';
const dur = (h) => h < 48 ? `${h} hours` : `${num(h / 24, h % 24 ? 1 : 0)} days`;
const SITE = 'https://homebackupcost.com';

// Validates/normalizes untrusted input (the Worker calls this on the POST body).
export function normalizeReport(d) {
  if (!d || typeof d !== 'object') throw new Error('missing report');
  const n = (v, max) => { const x = Number(v); if (!Number.isFinite(x) || x < 0 || x > max) throw new Error('bad number'); return x; };
  const str = (v, max = 160) => String(v ?? '').slice(0, max);
  const out = {
    source: d.source === 'calculator' ? 'calculator' : 'quickcheck',
    state: /^[A-Z]{2}$/.test(d.state || '') ? d.state : '',
    stateName: str(d.stateName, 40),
    hours: n(d.hours, 24 * 30), kwh: n(d.kwh, 1e4), dailyKwh: n(d.dailyKwh, 1e4), peakW: n(d.peakW, 1e6), runningW: n(d.runningW ?? 0, 1e6),
    items: (Array.isArray(d.items) ? d.items : []).slice(0, 40).map(i => ({ name: str(i.name, 80), qty: n(i.qty ?? 1, 99), hours: n(i.hours ?? 0, 24) })),
    best: d.best ? { label: str(d.best.label), cap: n(d.best.cap, 1e4), price: n(d.best.price, 1e6), url: safeUrl(d.best.url) } : null,
    installed: (Array.isArray(d.installed) ? d.installed : []).slice(0, 4).map(b => ({ label: str(b.label), low: n(b.low, 1e7), high: n(b.high, 1e7) })),
    generator: d.generator ? { runningW: n(d.generator.runningW, 1e6), startingW: n(d.generator.startingW, 1e6) } : null,
    solarW: d.solarW != null ? n(d.solarW, 1e6) : null,
    rebates: (Array.isArray(d.rebates) ? d.rebates : []).slice(0, 8).map(r => ({ program: str(r.program), amounts: str(r.amounts, 200), status: str(r.status, 80), url: safeUrl(r.url) })),
    asOf: str(d.asOf, 20),
  };
  return out;
}

export function buildReport(raw, { unsubscribeUrl = '' } = {}) {
  const d = normalizeReport(raw);
  const where = d.stateName ? ` in ${d.stateName}` : '';
  const subject = `Your backup power report: ${num(d.kwh, 1)} kWh for ${dur(d.hours)}`;
  const calcUrl = `${SITE}/calculator/?h=${d.hours}${d.state ? `&state=${d.state}` : ''}`;
  const T = [], H = [];
  T.push(`YOUR BACKUP POWER REPORT — HomeBackupCost`, '');
  T.push(`Battery needed: ${num(d.kwh, 1)} kWh for ${dur(d.hours)}${where} (estimate)`);
  T.push(`Peak power: about ${num(d.peakW)} W including start-up surge`);
  T.push(`Daily use: ${num(d.dailyKwh, 2)} kWh/day. Includes our 0.85 usable-capacity assumption.`, '');
  H.push(`<h1 style="font-size:22px;margin:0 0 4px">Your backup power report</h1><p style="color:#4a5578;margin:0 0 16px">From HomeBackupCost${d.asOf ? `, data as of ${esc(d.asOf)}` : ''}. All figures are estimates.</p>`);
  H.push(`<p style="font-size:30px;font-weight:800;color:#2a5a00;margin:0">${num(d.kwh, 1)} kWh</p><p style="margin:0 0 16px">of battery for ${esc(dur(d.hours))}${esc(where)}, peaks around <strong>${num(d.peakW)} W</strong> with start-up surge. Daily use ${num(d.dailyKwh, 2)} kWh. Includes our 0.85 usable-capacity assumption.</p>`);
  if (d.items.length) {
    T.push('What you want to keep on:'); d.items.forEach(i => T.push(`- ${i.qty > 1 ? i.qty + ' × ' : ''}${i.name}${i.hours ? ` (${i.hours} h/day)` : ''}`)); T.push('');
    H.push(`<h2 style="font-size:17px">What you want to keep on</h2><ul>${d.items.map(i => `<li>${i.qty > 1 ? i.qty + ' × ' : ''}${esc(i.name)}${i.hours ? ` <span style="color:#4a5578">(${i.hours} h/day)</span>` : ''}</li>`).join('')}</ul>`);
  }
  H.push('<h2 style="font-size:17px">Your options</h2><ul>');
  if (d.best) { T.push(`Cheapest portable setup: ${d.best.label}, ${num(d.best.cap, 2)} kWh, ${money(d.best.price)} listed price${d.best.url ? ` (source: ${d.best.url})` : ''}`); H.push(`<li><strong>Cheapest portable setup:</strong> ${esc(d.best.label)}, ${num(d.best.cap, 2)} kWh, <strong>${money(d.best.price)}</strong> listed price${d.best.url ? ` (<a href="${esc(d.best.url)}">price source</a>)` : ''}</li>`); }
  else { T.push('Portable: no single portable setup in our data covers this.'); H.push('<li><strong>Portable:</strong> no single portable setup in our data covers this.</li>'); }
  for (const b of d.installed) { T.push(`Whole-home battery: ${b.label}, about ${money(b.low)}–${money(b.high)} installed (estimate)`); H.push(`<li><strong>Whole-home battery:</strong> ${esc(b.label)}, about ${money(b.low)}–${money(b.high)} installed (estimate)</li>`); }
  if (d.generator) { T.push(`Generator: at least ${num(d.generator.runningW)} running W / ${num(d.generator.startingW)} starting W`); H.push(`<li><strong>Generator:</strong> at least ${num(d.generator.runningW)} running W / ${num(d.generator.startingW)} starting W</li>`); }
  if (d.solarW != null) { T.push(`Solar recharge: about ${num(d.solarW)} W of panels refills one day of use (assumes typical sun-hours)`); H.push(`<li><strong>Solar recharge:</strong> about ${num(d.solarW)} W of panels refills one day of use (assumes typical sun-hours)</li>`); }
  H.push('</ul>'); T.push('');
  H.push(`<h2 style="font-size:17px">Rebates${esc(where)}</h2><p>Federal tax credits for home batteries (25D) and heat pumps (25C) ended 12/31/2025.</p>`);
  T.push(`Rebates${where}: Federal tax credits for home batteries (25D) and heat pumps (25C) ended 12/31/2025.`);
  if (d.rebates.length) { H.push('<ul>' + d.rebates.map(r => `<li>${esc(r.program)}: ${esc(r.amounts)} — <em>${esc(r.status)}</em>${r.url ? ` (<a href="${esc(r.url)}">source</a>)` : ''}</li>`).join('') + '</ul>'); d.rebates.forEach(r => T.push(`- ${r.program}: ${r.amounts} — ${r.status}${r.url ? ` (${r.url})` : ''}`)); }
  else { H.push('<p>We haven\'t verified state or utility programs for your state yet.</p>'); T.push("We haven't verified state or utility programs for your state yet."); }
  T.push('', `Re-run or fine-tune: ${calcUrl}`, 'Not electrical, legal, or tax advice. Have a licensed electrician connect anything to your home\'s wiring. Prices change often; check the store.');
  H.push(`<p><a href="${esc(calcUrl)}" style="display:inline-block;background:#2a5a00;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Fine-tune in the calculator</a></p><p style="color:#4a5578;font-size:12px">Not electrical, legal, or tax advice. Have a licensed electrician connect anything to your home's wiring. Prices change often; check the store.</p>`);
  if (unsubscribeUrl) { T.push(`Unsubscribe: ${unsubscribeUrl}`); H.push(`<p style="color:#4a5578;font-size:12px"><a href="${esc(unsubscribeUrl)}">Unsubscribe</a></p>`); }
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(subject)}</title></head><body style="margin:0;background:#f6f8fc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0d1530;line-height:1.5"><div style="max-width:600px;margin:0 auto;padding:24px;background:#fff">${H.join('\n')}</div></body></html>`;
  return { subject, html, text: T.join('\n'), data: d };
}
