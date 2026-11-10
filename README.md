# Haven BlueTech

A lightweight, photographic, responsive frontend built with Vite and strict TypeScript. Pages are prerendered to static HTML for readable content without JavaScript. No runtime framework, backend, tracking, database, external font, or image CDN dependency.

## Local development

Requires Node.js 24.x and npm.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm run preview -- --port 5173
```

Seven pages: Home, About, Services, How It Works, Contact, Privacy Policy, Terms. Vercel settings are included in `vercel.json`: `npm run build`, output `dist`, and clean URLs. No deployment is performed by the project scripts.

## Review previews

Desktop and mobile screenshots for all seven pages are in `previews/`. Start the production preview above for an interactive review.

With Chromium installed at `/usr/bin/chromium`, run:

```sh
npm run test:browser
```

The script starts its own production preview on loopback port 4173 and checks all seven pages at 360, 390, 430, 768, 1024, and 1440px. It checks page errors, images, metadata, footer/navigation links, overflow, mobile navigation, inquiry validation/downloads/drafts, and no-JavaScript content. Extra home/contact overflow checks cover 320px. Results are recorded in `previews/verification.json`.

## Contact behavior and launch details

The contact form intentionally prepares a local text-file download. It does **not** send requests or claim that a message was delivered. Business phone: (612) 703-9119, linked on Contact and in the global footer. Public email: mplsmntowers@gmail.com. A prefilled email link lets visitors review and send an inquiry in their own email app. The website does not send automatically. Do not put private service keys in client code.

Copy ties “20+ years” specifically to the founder’s advertising experience, without claiming a company operating history or invented performance metrics. Services describe a proposed offering; confirm scope and public company/legal contact details before production. The legal pages accurately describe this frontend's current behavior and should be reviewed for the final business and hosting configuration.

## Design and accessibility

Navy foundation, electric blue and restrained violet accents, 2400px hero, asymmetric five-card photographic bento, rounded CTAs, and founder experience glass card. Local SVG brand mark is an original frontend interpretation of the supplied reference, not a recovered brand asset. No registered trademark assertion is made.

Mobile parallax is disabled. Reduced-motion preferences disable transitions, reveal animation, and parallax. Desktop parallax is limited to fine-pointer devices and disabled for data-saving connections. Keyboard focus styles, a skip link, semantic landmarks, labeled native form controls, and a dismissible mobile menu are included. Photography sources and licenses are documented in `PHOTO-CREDITS.md`.

## Repository state

Repository was empty on initial inspection: no files, branches, commits, or existing work. All frontend work is on `feat/haven-bluetech-frontend`. An empty baseline commit is available as the branch's root so `main` can be initialized with no website files if authorized. No merge or production deployment is authorized.

## Phase 2 pre-deployment review

See [PHASE2-VERIFICATION.md](PHASE2-VERIFICATION.md) for results and remaining issues, and [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel settings, environment variables, canonical/indexing strategy, and the exact Preview-only next step. `npm run lint` and `npm test` are available. No deployment has been performed.
