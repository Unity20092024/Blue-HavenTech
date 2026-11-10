# Phase 4 — implementation and verification

## Implemented

- Native Vercel Node 24 Web handler at `api/contact.ts`, with server-only delivery logic in `server/contact.ts`.
- Resend adapter sending only to `mplsmntowers@gmail.com`; no user-selected recipients or automatic visitor replies.
- Fail-closed feature switch, origin checks, JSON/body limits, shared field validation, explicit inquiry-only consent, and hidden honeypot.
- Atomic Upstash Redis limiter, keyed pseudonymous IP counters with expiry, per-environment daily budget, provider idempotency and timeouts.
- Accessible pending/error/acceptance states; inputs retained on error and reset only after provider acceptance. No message claims inbox delivery.
- Contact/Privacy/Terms use the owner-supplied business name and address. The 90-day unconverted inquiry retention recommendation is expressly proposed, pending approval and a real cleanup process. Provider usage is disclosed conditionally until activation.
- Homepage, images, palette, typography, layouts, and original button styles preserved. Added CSS is limited to functional contact consent, honeypot, invalid-field and pending controls.
- No new npm runtime dependencies; no account/resource provisioning, live email, DNS change, domain connection, or deployment.

## Verification

- `npm run build`: pass.
- `npm run typecheck`: pass, including API/server code.
- `npm run lint`: pass.
- `npm test`: pass; endpoint safety/failure/acceptance contracts and metadata policies tested with isolated test-only network responses. No live provider credentials or calls used.
- `npm run test:browser`: 42 page/viewport checks and 888 anchor checks pass at 360, 390, 430, 768, 1024 and 1440px; extra 320px home/contact checks pass.
- Browser scenarios exercise the real Web handler with simulated trusted boundary/provider responses: missing consent, whitespace name, unavailable configuration, rate rejection, provider acceptance, field retention/reset and accessible focus. This is not a Vercel deployment or an inbox-delivery test.
- Provider privacy links return HTTP 200.
- `https://havenbluetech.com` is accepted by the canonical policy code; Preview remains noindex even when that candidate is provided. Production environment settings have not been changed.
- A public DNS read returned NXDOMAIN for the supplied domain's A/AAAA/NS/MX on November 10, 2026. Owner-confirmed ownership does not establish working public DNS. No records were changed.

## Still blocked

Approve the proposed free Resend/Upstash account setup (or supply existing approved service names), arrange approved sender-domain authentication DNS changes, enter real secrets privately, confirm the registered-name/DBA relationship and retention choice, then authorize a new Preview deployment and a real inbox test. Read `CONTACT-SETUP.md` for exact variables and steps. No paid service or external account has been created. No delivery success is claimed.

The existing Phase 3 Preview remains at `a7c3984`, protected by Vercel Authentication and noindexed. Phase 4 is source code on the feature branch and has not been deployed.
