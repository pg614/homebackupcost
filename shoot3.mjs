import { chromium } from 'playwright';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:'dark'}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
for (const s of ['transfer-switch-vs-interlock-kit','standby-generator-installation-cost']) { await p.goto('http://127.0.0.1:4321/'+s+'/'); await p.waitForTimeout(300); await p.screenshot({path:`screenshots/${s}-mobile.png`,fullPage:true}); }
console.log('errs',errs); await b.close();
