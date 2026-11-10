import { validateInquiry } from './contact-fields';
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
const inquiryForm = document.querySelector<HTMLFormElement>('#contact-form');
const inquiryFields = inquiryForm?.querySelector<HTMLFieldSetElement>('fieldset');
const status = document.querySelector<HTMLElement>('#form-status');
const formError = document.querySelector<HTMLElement>('#form-error');
const submitButton = inquiryForm?.querySelector<HTMLButtonElement>('button[type="submit"]');
if (inquiryFields) inquiryFields.disabled = false;
let submissionId = crypto.randomUUID();
let submitting = false;

function clearErrors() {
  inquiryForm?.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  if (formError) { formError.hidden = true; formError.textContent = ''; }
}
function showError(message: string, errors: Record<string, string> = {}) {
  for (const key of ['name', 'email', 'company', 'interest', 'message', 'consent']) {
    if (errors[key]) document.getElementById(key)?.setAttribute('aria-invalid', 'true');
  }
  if (formError) {
    formError.textContent = message + (Object.keys(errors).length ? ' ' + Object.values(errors).join(' ') : '');
    formError.hidden = false;
    formError.focus();
  }
}
inquiryForm?.addEventListener('input', () => {
  clearErrors();
  if (status) status.textContent = '';
  submissionId = crypto.randomUUID();
});
inquiryForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (submitting) return;
  clearErrors();
  status!.textContent = '';
  const fields = new FormData(inquiryForm);
  const payload = {
    name: String(fields.get('name') ?? ''), email: String(fields.get('email') ?? ''),
    company: String(fields.get('company') ?? ''), interest: String(fields.get('interest') ?? ''),
    message: String(fields.get('message') ?? ''), website: String(fields.get('website') ?? ''),
    consent: fields.get('consent') === 'on', submissionId,
  };
  const validation = validateInquiry(payload);
  if (!validation.inquiry) { showError('Please check your inquiry.', validation.errors); return; }
  submitting = true;
  submitButton!.disabled = true;
  inquiryFields!.disabled = true;
  inquiryForm.setAttribute('aria-busy', 'true');
  status!.textContent = 'Submitting your inquiry…';
  try {
    const result = await fetch('/api/contact', {
      method: 'POST', credentials: 'same-origin', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validation.inquiry),
      signal: AbortSignal.timeout(15000),
    });
    const body = await result.json() as { message?: string; errors?: Record<string, string> };
    status!.textContent = '';
    if (result.status !== 202) {
      showError(body.message ?? 'Your inquiry could not be submitted. Please email mplsmntowers@gmail.com.', body.errors);
      return;
    }
    inquiryForm.reset();
    submissionId = crypto.randomUUID();
    status!.textContent = 'Your inquiry was accepted for sending. Inbox delivery is not confirmed. If your request is urgent, call (612) 703-9119.';
    status!.focus();
  } catch {
    status!.textContent = '';
    showError('We could not confirm submission. Your details are still here; please try again or email mplsmntowers@gmail.com. Inbox delivery is not confirmed.');
  } finally {
    submitting = false;
    inquiryFields!.disabled = false;
    submitButton!.disabled = false;
    inquiryForm.removeAttribute('aria-busy');
  }
});
