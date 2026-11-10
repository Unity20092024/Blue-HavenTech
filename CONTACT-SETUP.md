# Phase 4 — contact setup and approval boundary

## Recommendation

Use one Vercel Node 24 Function (`api/contact.ts`), **Resend** for transactional email, and **Upstash Redis** for a small shared rate-limit counter. This uses native server-side `fetch`, adds no runtime npm dependencies, and avoids a rate limiter that disappears on cold start or can be bypassed by moving between function instances. CAPTCHA is not included initially; consider it only if observed abuse justifies it.

Both providers advertise free plans suitable for low-volume inquiry traffic. At research time, [Resend Free](https://resend.com/pricing) lists 3,000 messages/month and a 100/day limit; [Upstash Free](https://upstash.com/pricing/redis) lists 500,000 commands/month. Confirm availability and limits in your own accounts. **No account, resource, plan, subscription, or billing upgrade has been created or approved.** Do not select pay-as-you-go, paid add-ons, or automatic upgrades without explicit approval. Confirm the existing Vercel plan is appropriate for the business use before public launch.

The required provider-directory research was attempted through the official Stripe CLI/plugin, but its search endpoint returned an invalid-user-agent error. No workaround, login, or provisioning was attempted. Recommendations and API contracts were checked against the providers' public official documentation instead.

## Business information

- Business name provided by owner: **BLUE HAVEN TECH**. The registered legal entity type / DBA relationship is not yet confirmed; no LLC, corporation, registration, or governing-law claim has been invented.
- Public address: **1006 West Lake Street, Suite 226, Minneapolis, MN 55408, United States**.
- Phone: **(612) 703-9119**.
- Recipient, fixed by server code: **mplsmntowers@gmail.com**. It is not taken from the request or silently replaced by an environment variable.
- Domain: **havenbluetech.com**, confirmed by the owner as business-owned.
- Retention proposal: delete unconverted inquiries 90 days after the last contact, with a regular manual inbox cleanup and applicable legal exceptions. Owner approval and an operational cleanup process are outstanding. This is not an automatic deletion guarantee.

## Implemented behavior

`POST /api/contact` accepts JSON and enforces an exact same-origin allowlist, body-size and field limits, email validation, allowed service values, no unexpected fields, explicit contact-only consent, and a honeypot. User input cannot select the recipient, sender, subject, provider URL, or email headers. Messages are sent as plain text, and replies go to the validated visitor address.

Redis makes one atomic Lua decision across function instances: five eligible submission attempts per IP per 15-minute counter window, and an aggregate cap of 80 per UTC day **per environment**. IP identifiers are keyed HMACs with a secret, rotated with the UTC date; counters expire after 15 minutes. Aggregate daily counters expire within two days. No name, email, message, or raw visitor IP is stored in Redis. Daily rotation can reset an IP bucket at the UTC boundary. The global limit and free-plan limits must be reviewed against any other email traffic or multiple environments using the same provider account.

Requests fail closed if required configuration, trusted Vercel client-IP information, Redis, or email acceptance is unavailable. This implementation expects requests to arrive directly through Vercel; do not put an unreviewed proxy in front of it or trust body-provided IPs. Five-attempt limits are basic abuse protection, not proof a sender is human. No automatic replies are sent to visitors, so the form cannot be used to email arbitrary third parties.

Provider requests use an idempotency key, have timeouts, and reject redirects. Client retries with unchanged fields retain the same submission ID; edits create a new one. This helps avoid duplicate email within Resend's 24-hour idempotency window. No automatic background retries are scheduled. A failed/ambiguous provider response is shown as unconfirmed, not successful delivery.

Only a provider response with an acceptance ID produces HTTP 202. The UI says **accepted for sending; inbox delivery is not confirmed**. Other cases show accessible errors, keep the inquiry, and offer the unchanged phone/direct email links. The form is disabled without JavaScript to avoid accidental GET disclosure. Names/messages/consent are revalidated server-side; client validation is not trusted.

Application logs contain only an outcome category and random server-generated request ID. No inquiry text, email address, raw IP, provider credentials, full provider responses, or request bodies are deliberately logged. Hosting/provider infrastructure may have its own logging and retention, which must be reviewed separately.

## Required accounts and DNS — do not set up without approval

1. Approve the proposed Resend and Upstash free-account setup, or name existing approved accounts. Use business-owned accounts with MFA. No provider account is created by the code.
2. Review domain status with the registrar. A read-only query to Google's public DNS resolver on November 10, 2026 returned **NXDOMAIN** for A, AAAA, NS, and MX on `havenbluetech.com`. This does not establish registration ownership; it means public DNS readiness is not established. Check registration status, spelling, and active authoritative nameservers before authorizing any change. **No DNS was edited.**
3. In Resend, add the proposed dedicated sending subdomain **`inquiries.havenbluetech.com`** after approval. Proposed From address: **`contact@inquiries.havenbluetech.com`**. This is a proposed sender, not an existing mailbox or a verified domain. Keep recipient `mplsmntowers@gmail.com` unchanged. Gmail is the receiving inbox; no Gmail password or app password is needed by this solution.
4. Resend's domain **Records** tab supplies the **exact** record names, values, and priorities for your account/region. They cannot be known honestly before that setup. Its current documentation requires DKIM authentication (TXT or provider-generated CNAME) and SPF/return-path verification (TXT + bounce MX, or generated CNAMEs). Some domains created after August 2026 use CNAME-based records. Copy the dashboard records exactly; do not invent a DKIM key, selector, return-path target, region, or SPF value. Consider a DMARC TXT policy for the sending subdomain after reviewing existing policy; do not invent a reporting mailbox or replace root records.
5. Adding sender-authentication records is separate from connecting the website domain. Do not change the website's A/AAAA/CNAME, existing root MX, nameservers, or DNS settings as part of this unapproved step. All DNS writes require separate explicit approval. Do not enable inbound email or open/click tracking for this contact form.
6. Wait until Resend reports the sending domain **verified**. Create a least-privilege, sending-only API key scoped to that domain where available. Keep the key private.
7. After approval, create an account-owned **free** Upstash Redis database, preferably in a region near the Vercel function (currently US East). Do not use an unclaimed temporary database or a paid plan. Obtain its REST URL and normal read/write REST token; the read-only token cannot run the atomic limiter.

Official references: [Resend domain setup](https://resend.com/docs/add-a-domain), [domain records](https://resend.com/docs/dashboard/domains/manage-domains), [send API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Upstash atomic EVAL](https://upstash.com/docs/redis/commands/scripting/eval).

## Exact environment variables

Enter these through Vercel's private environment settings on project **haven-bluetech**, team **dee's projects**, scoped to **Preview** during testing. Do not send secrets in chat. `.env.example` contains empty values only.

| Variable | Required value / source |
| --- | --- |
| `CONTACT_FORM_ENABLED` | `false` until approved setup is complete; set `true` for an authorized Preview delivery test. |
| `RESEND_API_KEY` | Sending-only key from the approved Resend account. Secret. |
| `RESEND_FROM_EMAIL` | Approved verified sender; proposed `contact@inquiries.havenbluetech.com`. Bare address. |
| `UPSTASH_REDIS_REST_URL` | Exact HTTPS `*.upstash.io` REST origin from the approved database. |
| `UPSTASH_REDIS_REST_TOKEN` | Database read/write REST token. Secret. |
| `CONTACT_RATE_LIMIT_SALT` | Random server-only secret, at least 32 characters. Generate privately; for example `openssl rand -hex 32`. |
| `CONTACT_ALLOWED_ORIGINS` | Optional comma-separated exact HTTPS origins, no paths, wildcards, or credentials. Preview's automatic `VERCEL_URL` origin is also accepted. For future production, include `https://havenbluetech.com` only after launch approval. |
| `VERCEL_ENV`, `VERCEL_URL` | Automatic Vercel variables. Do not override them. |
| `SITE_URL` | Future canonical candidate `https://havenbluetech.com`; keep unset until origin readiness and production launch are approved. Not a secret. |

No `CONTACT_TO` override is used. No credential needs a `VITE_` prefix. Secrets are never needed by the Vite client build. Keep Preview credentials isolated from production where practical; note separate quotas if both environments use one provider account.

## Activation and real delivery test — blocked pending owner action

After the accounts, sender verification, keys, legal disclosures, and retention choice are approved:

1. Configure Preview-only variables privately and authorize a new protected, noindexed Preview deployment of the reviewed Phase 4 commit. The existing Phase 3 Preview has not been changed by this work.
2. Authorize one real test inquiry. Verify HTTP 202, Resend acceptance/delivery status, and actual receipt in **mplsmntowers@gmail.com** (including spam folder). Acceptance alone is not inbox delivery. Do not log or screenshot credentials or sensitive message content.
3. Exercise the real Redis limit and verify 429 after the limit, without sending unnecessary real emails. Verify honeypot rejection, origin checks, malformed input, provider failure, and retry behavior on Preview.
4. Review the exact provider retention/region settings and update the conditional privacy disclosure before activation for customers. Set the approved inbox cleanup policy. Confirm the registered-name/DBA relationship and other applicable legal terms.
5. Production deployment, custom-domain connection, DNS changes, paid services, and any public launch still require separate approval.

No live provider call, email send, inbox receipt, provider account setup, domain verification, or DNS edit has been performed in Phase 4. The endpoint remains disabled until explicitly enabled with valid configuration.
