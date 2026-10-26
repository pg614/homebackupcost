import { chromium } from 'playwright';
const b = await chromium.launch();
const base='http://127.0.0.1:4321';
const errs=[];
for (const [name,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: name==='mobile'?2:1 });
  p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>m.type()==='error'&&errs.push(m.text()));
  await p.goto(base+'/'); await p.waitForTimeout(400);
  await p.screenshot({ path:`screenshots/home-${name}.png` });
  await p.screenshot({ path:`screenshots/home-${name}-full.png`, fullPage:true });
  await p.goto(base+'/calculator/?state=OH'); await p.waitForTimeout(300);
  // test case: fridge + furnace fan + Wi-Fi, 24h
  await p.click('[data-preset="none"]');
  for (const n of ['Refrigerator','Furnace fan 1/2 HP','Router/modem (Wi-Fi)']) await p.check(`.app[data-name="${n}"] .on`);
  await p.waitForTimeout(200);
  console.log(name,'top system:', ((await p.textContent('#results')).match(/Lowest cost.{0,170}/)||[''])[0]);
  console.log(name, 'UI result:', await p.textContent('#kwh'), '/', await p.textContent('#peak'), '|', await p.textContent('#peakSub'));
  await p.screenshot({ path:`screenshots/calculator-${name}.png` });
  await p.screenshot({ path:`screenshots/calculator-${name}-full.png`, fullPage:true });
  await p.locator('#results').screenshot({ path:`screenshots/calculator-${name}-results-24h.png` });
}
console.log('JS errors:', errs.length?errs:'none');
await b.close();
