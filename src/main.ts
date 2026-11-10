import { renderPage } from './render';
const route = location.pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/';
document.querySelector<HTMLDivElement>('#app')!.innerHTML = renderPage(route);
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav')!;
const closeMenu = () => {toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');mobileNav.hidden=true;};
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true'; toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');mobileNav.hidden=!open;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobileNav.hidden){closeMenu();toggle.focus();}});
matchMedia('(min-width: 901px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
if (!reduced.matches && 'IntersectionObserver' in window) { const observer = new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:0.08});document.querySelectorAll('.reveal').forEach(el=>{el.classList.add('will-reveal');observer.observe(el);}); }
const heroImage = document.querySelector<HTMLElement>('.hero > img');
if(heroImage&&matchMedia('(min-width: 901px) and (pointer: fine)').matches&&!reduced.matches&&!(navigator as Navigator&{connection?:{saveData:boolean}}).connection?.saveData){let ticking=false;window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{heroImage.style.transform=`translateY(${Math.min(window.scrollY*0.12,90)}px) scale(1.08)`;ticking=false;});ticking=true;}},{passive:true});}
const inquiryFields=document.querySelector<HTMLFieldSetElement>('#contact-form fieldset');
if(inquiryFields) inquiryFields.disabled=false;
document.querySelector<HTMLFormElement>('#contact-form')?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget as HTMLFormElement);const text=`Haven BlueTech — consultation inquiry\n\n${Array.from(data.entries()).map(([k,v])=>`${k}: ${v}`).join('\n\n')}\n\nThis inquiry has not been sent.`;const blob=new Blob([text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='haven-bluetech-inquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);const draft=document.querySelector<HTMLAnchorElement>('#email-draft')!;draft.href=`mailto:mplsmntowers@gmail.com?subject=${encodeURIComponent('Haven BlueTech consultation inquiry')}&body=${encodeURIComponent(text.replace('This inquiry has not been sent.',''))}`;draft.textContent='Open your email draft';const status=document.querySelector<HTMLElement>('#form-status')!;status.textContent='Your inquiry file is ready. Select “Open your email draft” to review and send it to mplsmntowers@gmail.com in your email app. Nothing has been sent automatically.';status.focus();});
