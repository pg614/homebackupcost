import { chromium } from 'playwright';
const B = 'http://127.0.0.1:4330';
const br = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  await ctx.addInitScript(t => localStorage.setItem('hbc-theme', t), theme);
  const p = await ctx.newPage();
  await p.goto(B + '/'); await p.fill('#qcZip', '43215'); await p.click('#qcStart button'); await p.click('#qcGo');
  await p.waitForSelector('#qcEmail:not([hidden])');
  await p.evaluate(() => { const e=document.querySelector('#qcEmail'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 380); }); await p.waitForTimeout(400);
  await p.screenshot({ path: `screenshots/email-report-quickcheck-mobile-${theme}.png` });
  await p.goto(B + '/calculator/?state=OH'); await p.waitForSelector('#calcEmail:not([hidden])');
  await p.evaluate(() => { const e=document.querySelector('#calcEmail'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 380); }); await p.waitForTimeout(400);
  await p.screenshot({ path: `screenshots/email-report-calculator-mobile-${theme}.png` });
  await p.locator('.nl >> nth=-1').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await p.screenshot({ path: `screenshots/newsletter-mobile-${theme}.png` });
  console.log(theme, await p.locator('#calcEmail button[type=submit]').isDisabled());
  await ctx.close();
}
await br.close();
