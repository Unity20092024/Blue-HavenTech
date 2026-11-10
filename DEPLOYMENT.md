# Vercel preview preparation

## Project settings

- Repository: `Unity20092024/Blue-HavenTech`
- Review branch: `feat/haven-bluetech-frontend`
- Framework: Vite, with TypeScript and build-time HTML prerendering (no React or server runtime).
- Root directory: repository root (`.`).
- Node.js: **24.x**, declared in `package.json`.
- Install: `npm ci` (include development dependencies; they provide build tooling).
- Build: `npm run build`.
- Output: `dist`.
- Existing `vercel.json` supplies the build command, output directory, clean URLs, and basic response headers.
- No database, functions, cron, or storage required for the current static preview.

## Environment variables

**No user-provided environment variables or secrets are required for Preview.**

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VERCEL_ENV` | Automatic Vercel system variable | `preview` keeps pages noindex; `production` requires an approved canonical origin. |
| `VERCEL_URL` | Automatic Vercel system variable | Hostname of this deployment, used for preview sitemap and social image URLs. Keep Vercel system-variable exposure enabled. |
| `SITE_URL` | Future Production build config | Full approved public HTTPS origin, with no path, query, fragment, or credentials. Not a secret. Do not invent a domain or configure DNS as part of this phase. |
| `CHROMIUM_EXECUTABLE` | Optional local test environment only | Override Chromium executable used by `npm run test:browser`. Otherwise system Chromium or the Playwright-managed browser is used. |

`.env.example` documents the template. Node build scripts read process environment variables; they do not automatically load `.env.local`. Set `SITE_URL` through the Vercel environment settings when a public origin is approved. A local production-mode check can pass variables through the shell. Never put private keys in `VITE_*` variables or commit `.env` files.

### Search indexing and canonical URLs

All seven pages have unique titles and descriptions, a local favicon, Open Graph metadata, and prerendered HTML. The build emits `robots.txt` and `sitemap.xml`.

- Local and Preview: `noindex,nofollow` in HTML and `Disallow: /` in robots. These are indexing controls, not access control. Use Vercel Deployment Protection for private reviews.
- Preview with automatic `VERCEL_URL`: absolute preview URLs appear in its sitemap. No deployment-specific canonical is invented.
- Local build without any URL: the sitemap is a valid empty URL set; no fabricated host is emitted.
- Once `SITE_URL` is approved, canonical URLs use it with clean paths. Preview still stays noindex even if this variable is present.
- Production: build fails if `SITE_URL` is absent or invalid. With it, robots permits crawling and the sitemap uses that stable origin.
- The 404 page remains noindex and has no canonical URL.

No domain has been connected and no DNS has been modified.

## Contact: precise current limitations

- Public telephone: **(612) 703-9119**, `tel:+16127039119`.
- Temporary public email: **mplsmntowers@gmail.com**, `mailto:mplsmntowers@gmail.com`.
- The form creates a local text-file download and a prefilled email link. The visitor must open an email app and send it. It is **not an automatic submission endpoint**.
- Required fields, email syntax, length limits, whitespace-only name/message rejection, draft reset after edits, and long-email URL fallback are checked.
- The disclosure and Privacy Policy explain the local preparation and subsequent email handoff. No marketing consent is requested or inferred, no marketing list is created, and no fields are submitted by this website. The visitor chooses whether to send from their email app.
- No server delivery service, server validation, CAPTCHA, rate limiting, or spam-filter integration is configured. Client validation is not an anti-spam control. Direct public email can receive unsolicited messages.
- **No live send, provider acceptance, or inbox receipt has been tested.** Do not call the current form a functioning automatic delivery form.

Before production with automatic submissions: choose an approved delivery service and abuse controls; configure credentials privately in Vercel; implement server validation and consent handling appropriate to the final flow; update the privacy policy; then test an authorized inquiry end-to-end through provider acceptance and receipt in the actual inbox. Define required variables only when the service is chosen rather than inventing unused credentials.

## Verification commands

```sh
npm ci
npm run build
npm run typecheck
npm run lint
npm test
npm run test:browser
npm audit
```

`test:browser` starts its own production preview on loopback port **4173**; keep that port free. Chromium must be installed (`npx playwright install chromium` if using Playwright-managed Chromium). Screenshots and the verification report go to `previews/`. This local test approximates Vercel clean-URL routing; verify real platform redirects, response headers, HTTP 404 behavior, and deployment protection after a preview exists.

## Exact recommended next step (requires deployment approval)

From this repository and the reviewed feature-branch commit, use the Vercel CLI to create **a Preview**:

```sh
git checkout feat/haven-bluetech-frontend
vercel deploy
```

If not linked, select the intended Vercel account/team and create or link the intended project in the prompts, using the settings above. Verify the target and that the deployment is Preview. Do **not** use `--prod`, promote, add domains, or change DNS. If using Git integration later, explicitly keep its Production Branch set to the intended `main`; do not let the feature branch become an automatic production source.

No Vercel project linked to this repository was returned in the connected account scope during this audit. No Vercel project was created or linked in this phase. GitHub's `main` still does not exist, so a PR targeting it remains blocked until an empty baseline initialization is approved. This does not prevent a CLI Preview from the feature branch.
