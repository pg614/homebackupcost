import { chromium } from 'playwright';
const b = await chromium.launch(); const base='http://127.0.0.1:4321'; const errs=[];
for (const [name,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]) for (const theme of ['light','dark']) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name==='mobile'?2:1, colorScheme: theme });
  const p = await ctx.newPage(); p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>m.type()==='error'&&errs.push(m.text()));
  await p.goto(base+'/'); await p.waitForTimeout(300);
  console.log(name, theme, 'data-theme=', await p.getAttribute('html','data-theme'));
  await p.screenshot({ path:`screenshots/home-${name}-${theme}.png` });
  await p.goto(base+'/calculator/?state=OH&h=72'); await p.check('#solarOn'); await p.waitForTimeout(300);
  await p.screenshot({ path:`screenshots/calculator-${name}-${theme}.png` });
  await p.locator('#results').screenshot({ path:`screenshots/calculator-${name}-${theme}-results-solar.png` });
  if (theme==='dark') {
    await p.goto(base+'/'); await p.fill('#qcZip','43215'); await p.click('#qcStart button');
    await p.check('[name=load][value=climate]'); await p.check('[name=dur][value="72"]'); await p.waitForTimeout(200);
    await p.locator('#qc').screenshot({ path:`screenshots/quickcheck-${name}-questions.png` });
    await p.click('#qcGo'); await p.waitForTimeout(800); await p.addStyleTag({content:'header.site{position:static!important}'});
    await p.locator('#qc').screenshot({ path:`screenshots/quickcheck-${name}-results.png` });
    console.log(name,'QC:', (await p.textContent('#qcOut')).replace(/\s+/g,' ').slice(0,400));
    await p.goto(base+'/quotes/?zip=43215'); await p.waitForTimeout(200);
    await p.screenshot({ path:`screenshots/quotes-${name}.png`, fullPage:true });
    console.log('consent default checked:', await p.isChecked('#qfConsent'));
    await p.goto(base+'/solar-backup/'); await p.screenshot({ path:`screenshots/solar-backup-${name}.png`, fullPage:true });
    // toggle persists
    await p.goto(base+'/'); await p.click('#themeBtn'); await p.reload(); console.log('after toggle+reload:', await p.getAttribute('html','data-theme'));
  }
  await ctx.close();
}
console.log('JS errors:', errs.length?errs:'none'); await b.close();
