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
const inquiryForm = document.querySelector<HTMLFormElement>('#contact-form');
const draft = document.querySelector<HTMLAnchorElement>('#email-draft');
const status = document.querySelector<HTMLElement>('#form-status');
inquiryForm?.addEventListener('input', () => {
  inquiryForm.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach(field => field.setCustomValidity(''));
  if (draft) {
    draft.href = 'mailto:mplsmntowers@gmail.com';
    draft.textContent = 'Email us directly';
  }
  if (status) status.textContent = '';
});
inquiryForm?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(inquiryForm);
  const name = inquiryForm.querySelector<HTMLInputElement>('#name')!;
  const message = inquiryForm.querySelector<HTMLTextAreaElement>('#message')!;
  name.setCustomValidity(name.value.trim() ? '' : 'Please enter your name.');
  message.setCustomValidity(message.value.trim().length >= 10 ? '' : 'Please enter at least 10 characters about your goals.');
  if (!inquiryForm.reportValidity()) return;
  const fields = Array.from(data.entries()).map(([key, value]) => `${key}: ${String(value).trim()}`).join('\n\n');
  const body = `Haven BlueTech — consultation inquiry\n\n${fields}`;
  const text = `${body}\n\nThis inquiry has not been sent.`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'haven-bluetech-inquiry.txt';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const subject = encodeURIComponent('Haven BlueTech consultation inquiry');
  const fullDraft = `mailto:mplsmntowers@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`;
  // Email clients have different URL limits. Keep the downloaded file as a
  // reliable fallback for long inquiries rather than silently truncating them.
  const longInquiry = fullDraft.length > 1800;
  draft!.href = longInquiry ? `mailto:mplsmntowers@gmail.com?subject=${subject}` : fullDraft;
  draft!.textContent = 'Open your email draft';
  status!.textContent = longInquiry
    ? 'Your inquiry file is ready. Open your email draft and attach the downloaded file to include your full inquiry. Nothing has been sent automatically.'
    : 'Your inquiry file is ready. Select “Open your email draft” to review and send it to mplsmntowers@gmail.com in your email app. Nothing has been sent automatically.';
  status!.focus();
});
