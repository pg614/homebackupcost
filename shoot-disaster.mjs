import { chromium } from 'playwright';
const B='https://pg614.github.io/homebackupcost/'; const b=await chromium.launch(); const errs=[];
for (const [vp,tag] of [[{width:390,height:844},'mobile'],[{width:1366,height:900},'desktop']]) {
 const p=await (await b.newContext({viewport:vp,deviceScaleFactor:2})).newPage(); p.on('pageerror',e=>errs.push(e.message));
 await p.goto(B+'winter-storm-power-outage-heat/'); await p.waitForTimeout(500); await p.screenshot({path:`screenshots/winter-storm-${tag}.png`,fullPage:true});
 await p.goto(B+'calculator/?scenario=winter'); await p.waitForTimeout(800); await p.fill('#panels','2'); await p.dispatchEvent('#panels','input'); await p.waitForTimeout(300);
 console.log(tag, await p.textContent('#lastOut'), 'noindex:', await p.locator('meta[name=robots]').getAttribute('content'));
 await p.locator('#calc').screenshot({path:`screenshots/calc-scenario-winter-${tag}.png`});
 await p.click('[data-scen=hurricane]'); await p.waitForTimeout(300); console.log('hurricane', (await p.textContent('#lastOut')).slice(0,120));
}
console.log('errs',errs); await b.close();
