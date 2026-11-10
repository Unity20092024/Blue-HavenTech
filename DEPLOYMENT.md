# Vercel preparation — current Phase 4 state

## Confirmed project

- GitHub: `Unity20092024/Blue-HavenTech`, branch `feat/haven-bluetech-frontend`.
- Vercel project: `haven-bluetech`, `prj_D5IUmDkllngMFMIkxWuGBVyxsumy`.
- Team: `dee's projects`, `team_TExJza4pTWjPK1nKXMKX8uYd` / `dees-projects-ac22187b`.
- Framework: Vite frontend with build-time HTML prerendering, plus a native Vercel Node Web handler at `api/contact.ts`.
- Node 24.x, repository root, install `npm ci`, build `npm run build`, output `dist`.
- API max duration: 20 seconds; provider calls have shorter timeouts.
- Existing protected Phase 3 Preview: https://haven-bluetech-68z7r5bg3-dees-projects-ac22187b.vercel.app, commit `a7c3984`.

Phase 4 code has **not** been deployed. No production release became ready in Phase 3. Its initial implicitly production-targeted first deployment failed at the production-origin guard; the successful subsequent deployment is Preview (`target: null`). Do not rely on an omitted target for a brand-new Vercel project: the platform assigns its first deployment to production. Always inspect the actual returned environment before proceeding. Do not use a staging/custom environment as a substitute for the approved Preview scope.

## Contact setup gate

Read [CONTACT-SETUP.md](CONTACT-SETUP.md) for the required owner approvals, proposed business-owned free Resend/Upstash accounts, proposed verified sending subdomain, exact provider-generated DNS requirements, server-only environment variables, and real delivery-test plan. The existing inbox is **mplsmntowers@gmail.com** and must not be silently changed.

A frontend build needs no credentials. The server remains unavailable until `CONTACT_FORM_ENABLED=true` and all approved runtime variables are correctly configured. Keep Preview secrets separate where practical; never prefix them with `VITE_`, commit them, or paste them in chat. No environment variables or provider resources were changed in Phase 4.

Native Vercel API routing/bundling and live Redis/Resend behavior must be verified on a newly authorized protected Preview after setup. Local tests exercise the Web handler and UI with isolated mocked provider responses; they do not prove provider acceptance, inbox receipt, or platform routing.

## Canonical and crawler policy

The owner confirms `havenbluetech.com` is business-owned. The candidate canonical origin is **https://havenbluetech.com**, which passes the policy tests. A read-only public resolver check returned NXDOMAIN for A/AAAA/NS/MX; registration/nameserver/public DNS readiness must be resolved through the registrar before domain launch. No DNS edits or connection were performed.

- Keep `SITE_URL` unset until public-origin readiness and production launch are approved.
- Preview/local builds emit noindex metadata and disallow crawling in robots. Vercel also supplies Preview noindex headers. These are indexing controls; Vercel Authentication remains the access control.
- With automatic `VERCEL_URL`, Preview emits an absolute seven-page sitemap for that deployment. Without a URL, a local build emits a valid empty sitemap, not a fabricated hostname.
- `SITE_URL`, once approved, provides stable clean canonical paths and social URLs. Preview stays noindex even when it is present.
- Production-mode builds require an approved valid HTTPS `SITE_URL`; the 404 page stays noindex and omits canonical metadata.

No custom domain, DNS, production environment variable, or production deployment is authorized as part of Phase 4.

## Verification

```sh
npm ci
npm run build
npm run typecheck
npm run lint
npm test
npm run test:browser
```

Browser checks require Chromium and a free loopback port 4173. They cover all seven pages at six viewport widths and use test-only provider responses for the form. The existing protected deployed Preview still runs the earlier Phase 3 draft/download form until a new Preview deployment is separately approved.
