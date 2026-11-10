# Haven BlueTech

A lightweight Vite + strict TypeScript frontend, with prerendered HTML and a prepared Vercel Node 24 contact endpoint. The approved photography, palette, layout, typography, and signature button styles are preserved. The contact endpoint is **disabled by default**, pending approved provider setup and a real delivery test. No runtime npm dependencies are added.

## Local checks

Requires Node.js 24.x and npm.

```sh
npm ci
npm run build
npm run typecheck
npm run lint
npm test
npm run test:browser
```

`npm run dev` and `npm run preview` serve the frontend. Vite alone does not run the Vercel endpoint. `test:browser` starts a local production preview on loopback port 4173 and exercises form UI and the real Web handler using test-only provider responses. It never uses provider accounts or sends email. Chromium must be installed; use `CHROMIUM_EXECUTABLE` to select a binary if necessary.

Seven pages: Home, About, Services, How It Works, Contact, Privacy Policy, Terms. Vercel settings: `npm ci`, `npm run build`, output `dist`, Node 24, clean URLs. The native endpoint lives at `api/contact.ts` and is built separately by Vercel. No deployment is run by the npm scripts.

## Current work: Phase 4

Read [CONTACT-SETUP.md](CONTACT-SETUP.md) before any provider account setup, DNS edits, environment changes, or delivery testing. It documents the proposed Resend + Upstash free-tier solution, approvals, exact variables, data handling, business details, and unresolved domain/DNS readiness. [PHASE4-VERIFICATION.md](PHASE4-VERIFICATION.md) records what was actually tested.

The server recipient remains **mplsmntowers@gmail.com**. Phone: **(612) 703-9119**. Automatic submission uses server validation, explicit inquiry-only consent, a honeypot, a shared Redis limit, and provider idempotency. Missing configuration/services fail closed with an honest error and direct contact alternatives. HTTP 202 means accepted for sending, not confirmed inbox delivery. No live email, provider acceptance, or inbox receipt has been verified.

Business name/address were supplied by the owner. Registered-name/DBA details and the proposed 90-day unconverted-inquiry cleanup policy still need confirmation. The privacy page describes the not-yet-activated services conditionally; do not remove those qualifications until setup and actual handling are confirmed.

## Previews and design

`previews/` includes responsive screenshots and `verification.json` covering 360, 390, 430, 768, 1024 and 1440px; extra home/contact overflow checks cover 320px. All seven pages are pictured at 390px and 1440px. Form tests simulate unavailable service, validation, rate rejection, and acceptance messages; no screenshot is proof of real email delivery.

Photos are local WebP files with a 2400px hero. Their sources/licenses are in [PHOTO-CREDITS.md](PHOTO-CREDITS.md). Reduced motion and mobile parallax restrictions remain intact. Contact-only additions support consent, honeypot hiding, invalid fields, and pending state; original homepage/button styling is unchanged.

The protected Phase 3 Preview remains at commit `a7c3984` and has not received Phase 4 changes. Phase 4 is not deployed. [DEPLOYMENT.md](DEPLOYMENT.md) describes current preparation. `PHASE2-VERIFICATION.md` is a historical audit of the earlier static draft/download form, not a description of the new server endpoint.

## Repository boundaries

Work stays on `feat/haven-bluetech-frontend`. No merge or production deployment is authorized. `main` has never been initialized; a draft PR to `main` remains blocked pending approval of the empty baseline. Do not deploy the repository's default feature branch as production.
