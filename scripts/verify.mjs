import { chromium } from '@playwright/test';
import { preview } from 'vite';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { routes } from './site-metadata.mjs';

const server=await preview({preview:{host:'127.0.0.1',port:4173,strictPort:true}});
const base='http://127.0.0.1:4173';
const executablePath=process.env.CHROMIUM_EXECUTABLE ?? (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
let browser;
const results=[];
const failures=[];
const linkDestinations=new Set();
let linksChecked=0;
const check=(condition,message)=>{if(!condition)failures.push(message);};
const expectedHeadings={ '/':'Real Connections.', '/about':'Built on experience.', '/services':'Your business.', '/how-it-works':'Start with a conversation.', '/contact':'Good things start', '/privacy':'Privacy Policy', '/terms':'Terms of Use' };
try {
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
  await mkdir('previews',{recursive:true});
  for(const width of [360,390,430,768,1024,1440]) {
    const context=await browser.newContext({viewport:{width,height:width<600?844:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
    const page=await context.newPage();
    page.on('pageerror',error=>failures.push(`${width}px browser error: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)failures.push(`${width}px HTTP ${response.status()}: ${response.url()}`);});
    for(const path of routes) {
      const response=await page.goto(base+path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(async()=>{
        for(let y=0;y<document.body.scrollHeight;y+=650) {
          window.scrollTo(0,y);await new Promise(resolve=>setTimeout(resolve,30));
        }
        await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));
        window.scrollTo(0,0);
      });
      const info=await page.evaluate(()=>({
        overflow:document.documentElement.scrollWidth>innerWidth,
        images:[...document.images].filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.src),
        h1:document.querySelectorAll('h1').length,
        heading:document.querySelector('h1')?.textContent,
        imageStyles:[...document.images].map(image=>({src:image.currentSrc.split('/').pop(),fit:getComputedStyle(image).objectFit,position:getComputedStyle(image).objectPosition})),
        footerLinks:[...document.querySelectorAll('footer a')].map(link=>link.getAttribute('href')),
        links:[...document.querySelectorAll('a')].map(link=>({href:link.getAttribute('href'),text:link.textContent?.trim(),hashExists:!link.hash||Boolean(document.getElementById(decodeURIComponent(link.hash.slice(1))))})),
        metadata:{title:document.title,description:document.querySelector('meta[name="description"]')?.getAttribute('content'),robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),favicon:document.querySelector('link[rel="icon"]')?.getAttribute('href')},
      }));
      check(response.status()===200,`${width}px ${path}: response ${response.status()}`);
      check(!info.overflow,`${width}px ${path}: horizontal overflow`);
      check(info.images.length===0,`${width}px ${path}: broken images ${info.images.join(', ')}`);
      check(info.h1===1&&info.heading.includes(expectedHeadings[path]),`${width}px ${path}: wrong heading`);
      check(Boolean(info.metadata.title&&info.metadata.description&&info.metadata.robots&&info.metadata.favicon),`${path}: incomplete metadata`);
      for(const legal of ['/contact','/privacy','/terms'])check(info.footerLinks.includes(legal),`${path}: missing footer ${legal}`);
      for(const link of info.links) {
        linksChecked++;
        const href=link.href;
        check(Boolean(href)&&href!=='#',`${path}: empty link ${link.text}`);
        if(href.startsWith('#'))check(link.hashExists,`${path}: missing hash ${href}`);
        else if(href.startsWith('mailto:'))check(href==='mailto:mplsmntowers@gmail.com',`${path}: incorrect business email`);
        else if(href.startsWith('tel:'))check(href==='tel:+16127039119',`${path}: incorrect business phone`);
        else {check(routes.includes(href),`${path}: unknown link ${href}`);linkDestinations.add(href);}
      }
      const summary={...info};
      delete summary.links;
      results.push({width,path,status:response.status(),...summary});
      if(width===390||width===1440||path==='/'||path==='/contact') {
        await page.screenshot({path:`previews/${path==='/'?'home':path.slice(1)}-${width}.png`,fullPage:true});
      }
    }
    if(width<=768) {
      await page.goto(base+'/');
      await page.getByRole('button',{name:'Open navigation'}).click();
      check(await page.locator('#mobile-nav').isVisible(),`${width}px menu did not open`);
      await page.keyboard.press('Escape');
      check(!await page.locator('#mobile-nav').isVisible(),`${width}px Escape did not close menu`);
      await page.getByRole('button',{name:'Open navigation'}).click();
      await page.locator('#mobile-nav').getByRole('link',{name:'Let’s connect'}).click();
      check(new URL(page.url()).pathname==='/contact',`${width}px mobile contact navigation failed`);
    }
    await page.goto(base+'/contact');
    const form=page.locator('#contact-form');
    await page.getByRole('button',{name:'Prepare my inquiry'}).click();
    check(!await form.evaluate(form=>form.checkValidity()),`${width}px empty inquiry accepted`);
    await page.getByLabel('Your name').fill('Preview Visitor');
    await page.getByLabel('Email address').fill('invalid-address');
    await page.getByLabel('Tell us about your goals').fill('I would like to explore a new direction for my home service business.');
    check(!await form.evaluate(form=>form.checkValidity()),`${width}px invalid email accepted`);
    await page.getByLabel('Email address').fill('preview@example.com');
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Prepare my inquiry'}).click();
    const download=await downloadPromise;
    check(download.suggestedFilename()==='haven-bluetech-inquiry.txt',`${width}px inquiry download failed`);
    const draft=await page.locator('#email-draft').getAttribute('href');
    check(draft?.startsWith('mailto:mplsmntowers@gmail.com?')&&decodeURIComponent(draft).includes('Preview Visitor'),`${width}px email draft incorrect`);
    check((await page.locator('#form-status').textContent()).includes('Nothing has been sent automatically'),`${width}px misleading delivery status`);
    await page.getByLabel('Your name').fill('Updated Visitor');
    check(await page.locator('#email-draft').getAttribute('href')==='mailto:mplsmntowers@gmail.com',`${width}px stale draft retained after edits`);
    await page.getByLabel('Your name').fill('   ');
    await page.getByRole('button',{name:'Prepare my inquiry'}).click();
    check(!await form.evaluate(form=>form.checkValidity()),`${width}px whitespace name accepted`);
    await page.getByLabel('Your name').fill('Preview Visitor');
    await page.getByLabel('Tell us about your goals').fill('Long inquiry. '.repeat(200));
    const longDownloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Prepare my inquiry'}).click();
    await longDownloadPromise;
    check(!(await page.locator('#email-draft').getAttribute('href')).includes('&body='),`${width}px oversized mailto URL`);
    check((await page.locator('#form-status').textContent()).includes('attach the downloaded file'),`${width}px missing long-inquiry instructions`);

    await context.close();
  }
  const noJs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await noJs.goto(base+'/contact');
  check(await noJs.getByRole('heading',{level:1}).isVisible(),'No-JS page missing prerendered content');
  check(await noJs.getByRole('button',{name:'Prepare my inquiry'}).isDisabled(),'No-JS form could leak data through GET');
  await noJs.close();
  const tiny=await browser.newPage({viewport:{width:320,height:700}});
  for(const path of ['/','/contact']){await tiny.goto(base+path);check(!await tiny.evaluate(()=>document.documentElement.scrollWidth>innerWidth),`320px ${path} overflow`);}
  await tiny.close();
  for(const asset of ['/robots.txt','/sitemap.xml','/favicon.svg']) {
    const response=await fetch(base+asset);check(response.ok,`Missing ${asset}`);
  }
  assert.equal(routes.length,7);
  await writeFile('previews/verification.json',JSON.stringify({viewports:[360,390,430,768,1024,1440],results,linksChecked,linkDestinations:[...linkDestinations],contactDelivery:'Local download and mailto draft only; no live send or inbox delivery tested.',failures},null,2));
  console.log(JSON.stringify({pagesChecked:results.length,linksChecked,failures},null,2));
  if(failures.length)process.exitCode=1;
} finally {
  await browser?.close();
  await new Promise(resolve=>server.httpServer.close(resolve));
}
