import { chromium } from 'playwright';
const b=await chromium.launch();
for (const [n,w,h] of [['desktop',1280,800],['mobile',390,844]]) for (const t of ['light','dark']) {
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:n=='mobile'?2:1,colorScheme:t}); const p=await ctx.newPage();
 await p.goto('http://127.0.0.1:4321/'); await p.waitForTimeout(800); await p.screenshot({path:`screenshots/hero-${n}-${t}.png`}); await ctx.close(); }
await b.close();
