import { chromium } from 'playwright';
const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:'light'});
const p=await c.newPage();await p.goto(process.argv[2]);await p.waitForTimeout(1200);
console.log(await p.evaluate(()=>document.getElementById('hero-light').currentSrc));
await p.screenshot({path:'screenshots/hero3-mobile-light.png'});await b.close();
