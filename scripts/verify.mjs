import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[]; const failures=[];
await mkdir('previews',{recursive:true});
for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:width===390?844:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
 page.on('pageerror',e=>failures.push(e.message));
 for(const path of ['/','/about','/services','/how-it-works','/contact','/privacy','/terms']){
  const response=await page.goto('http://localhost:5173'+path);await page.waitForLoadState('networkidle');
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));}window.scrollTo(0,0);await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});
  const info=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),h1:document.querySelectorAll('h1').length}));
  if(response.status()!==200||info.overflow||info.images.length||info.h1!==1)failures.push({width,path,status:response.status(),...info});
  results.push({width,path,status:response.status(),...info});
  await page.screenshot({path:`previews/${path==='/'?'home':path.slice(1)}-${width}.png`,fullPage:true});
 }
 if(width===390){await page.goto('http://localhost:5173/');await page.getByRole('button',{name:'Open navigation'}).click();if(!await page.locator('#mobile-nav').isVisible())failures.push('Menu did not open');await page.keyboard.press('Escape');if(await page.locator('#mobile-nav').isVisible())failures.push('Escape did not close menu');}
 await page.goto('http://localhost:5173/contact');
 await page.getByLabel('Your name').fill('Preview Visitor');await page.getByLabel('Email address').fill('preview@example.com');await page.getByLabel('Tell us about your goals').fill('I would like to explore a new direction for my home service business.');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Prepare my inquiry'}).click();const download=await downloadPromise;
 if(download.suggestedFilename()!=='haven-bluetech-inquiry.txt')failures.push('Download failed');
 const draft=await page.locator('#email-draft').getAttribute('href');
 if(!draft?.startsWith('mailto:mplsmntowers@gmail.com?')||!decodeURIComponent(draft).includes('Preview Visitor'))failures.push('Email draft recipient or body incorrect');
 await page.close();
}
const tiny=await browser.newPage({viewport:{width:320,height:700}});await tiny.goto('http://localhost:5173');if(await tiny.evaluate(()=>document.documentElement.scrollWidth>innerWidth))failures.push('320px overflow');await tiny.close();
await writeFile('previews/verification.json',JSON.stringify({results,failures},null,2));await browser.close();console.log(JSON.stringify({pagesChecked:results.length,failures},null,2));if(failures.length)process.exit(1);
