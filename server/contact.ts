import { createHmac, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { businessEmail, isEmail, validateInquiry } from '../src/contact-fields.ts';

type Environment = Record<string, string | undefined>;
type Dependencies = { env?: Environment; fetch?: typeof fetch; now?: () => number; log?: (event: { event: string; requestId: string }) => void };
const maximumBodyBytes = 24 * 1024;
const unavailable = 'Automatic submissions are not available right now. Please email mplsmntowers@gmail.com or call (612) 703-9119.';
const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' };
const response = (status: number, body: object, extra: Record<string, string> = {}) => Response.json(body, { status, headers: { ...headers, ...extra } });

function settings(env: Environment) {
  if (env.CONTACT_FORM_ENABLED !== 'true') return null;
  const { RESEND_API_KEY: apiKey, RESEND_FROM_EMAIL: from, UPSTASH_REDIS_REST_URL: redisUrl, UPSTASH_REDIS_REST_TOKEN: redisToken, CONTACT_RATE_LIMIT_SALT: salt, CONTACT_ALLOWED_ORIGINS: origins } = env;
  if (!apiKey || !from || !isEmail(from) || !/@(?:inquiries\.)?havenbluetech\.com$/i.test(from) || !redisUrl || !redisToken || !salt || salt.length < 32) return null;
  try {
    const redis = new URL(redisUrl);
    if (redis.protocol !== 'https:' || !redis.hostname.endsWith('.upstash.io') || redis.username || redis.password || redis.pathname !== '/' || redis.search || redis.hash) return null;
    const candidates = (origins ?? '').split(',').map(value => value.trim()).filter(Boolean);
    if (env.VERCEL_ENV === 'preview' && env.VERCEL_URL) candidates.push(`https://${env.VERCEL_URL}`);
    if (!candidates.length) return null;
    const allowedOrigins = candidates.map(value => {
      const url = new URL(value.trim());
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid origin');
      return url.origin;
    });
    return { apiKey, from, redisUrl: redis.origin, redisToken, salt, allowedOrigins };
  } catch { return null; }
}

async function readJson(request: Request) {
  if (Number(request.headers.get('content-length')) > maximumBodyBytes) throw new RangeError('Body limit');
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBodyBytes) { await reader.cancel(); throw new RangeError('Body limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
}

// One atomic decision across all function instances. No inquiry data is stored.
// Each IP gets five accepted attempts per 15 minutes; the whole form gets 80/day.
export const rateLimitScript = `
local ip = tonumber(redis.call('GET', KEYS[1]) or '0')
local total = tonumber(redis.call('GET', KEYS[2]) or '0')
if ip >= 5 then return {0, math.max(1, redis.call('TTL', KEYS[1]))} end
if total >= 80 then return {0, 3600} end
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], 900) end
local day = redis.call('INCR', KEYS[2])
if day == 1 then redis.call('EXPIRE', KEYS[2], 172800) end
return {1, 0}
`;

export function createContactHandler(dependencies: Dependencies = {}) {
  const env = dependencies.env ?? process.env;
  const send = dependencies.fetch ?? fetch;
  const now = dependencies.now ?? Date.now;
  const log = dependencies.log ?? (event => console.info(JSON.stringify(event)));
  return async function handleContact(request: Request): Promise<Response> {
    const requestId = randomUUID();
    const record = (event: string) => log({ event, requestId });
    if (request.method !== 'POST') return response(405, { message: 'Use POST to submit an inquiry.' }, { Allow: 'POST' });
    const config = settings(env);
    if (!config) { record('contact.unavailable'); return response(503, { message: unavailable }); }
    if (!config.allowedOrigins.includes(request.headers.get('origin') ?? '') || request.headers.get('sec-fetch-site') === 'cross-site') return response(403, { message: 'Please submit from the Haven BlueTech Contact page.' });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return response(415, { message: 'Please reload the Contact page and try again.' });
    let raw: unknown;
    try { raw = await readJson(request); } catch (error) {
      return response(error instanceof RangeError ? 413 : 400, { message: 'Your inquiry could not be read. Please shorten it and try again.' });
    }
    // Never send or pretend to accept a honeypot submission.
    if (raw && typeof raw === 'object' && 'website' in raw && raw.website !== '') return response(400, { message: 'The inquiry could not be submitted. Please contact us directly.' });
    const { inquiry, errors } = validateInquiry(raw);
    if (!inquiry) return response(422, { message: 'Please review the highlighted fields.', errors });
    // Vercel supplies this trusted edge header; do not accept a body IP or a
    // client-selected forwarding header. No reverse proxy in front is supported.
    const ip = request.headers.get('x-vercel-forwarded-for')?.trim() ?? '';
    if (!isIP(ip)) { record('contact.client_unavailable'); return response(503, { message: unavailable }); }
    const date = new Date(now()).toISOString().slice(0, 10);
    const identity = createHmac('sha256', config.salt).update(`${date}:${ip}`).digest('hex');
    const scope = env.VERCEL_ENV === 'production' ? 'production' : 'preview';
    try {
      const limit = await send(config.redisUrl, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000),
        headers: { Authorization: `Bearer ${config.redisToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(['EVAL', rateLimitScript, 2, `haven:${scope}:contact:ip:${identity}`, `haven:${scope}:contact:day:${date}`]),
      });
      if (!limit.ok) throw new Error('Limiter unavailable');
      const body = await limit.json() as { result?: unknown };
      if (!Array.isArray(body.result) || body.result.length !== 2 || ![0, 1].includes(body.result[0]) || !Number.isInteger(body.result[1]) || body.result[1] < 0) throw new Error('Invalid limiter response');
      if (body.result[0] === 0) return response(429, { message: 'Too many inquiries. Please wait before trying again, or contact us directly.' }, { 'Retry-After': String(body.result[1]) });
    } catch { record('contact.rate_service_unavailable'); return response(503, { message: unavailable }); }
    try {
      const accepted = await send('https://api.resend.com/emails', {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `haven-contact/${inquiry.submissionId}` },
        body: JSON.stringify({
          from: `Haven BlueTech <${config.from}>`, to: [businessEmail], reply_to: inquiry.email,
          subject: 'Haven BlueTech website inquiry',
          text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nBusiness: ${inquiry.company || '(not provided)'}\nService: ${inquiry.interest}\n\n${inquiry.message}\n\nConsent: permission to respond to this inquiry; no marketing signup.`,
        }),
      });
      const body = await accepted.json() as { id?: unknown };
      if (!accepted.ok || typeof body.id !== 'string' || !body.id) throw new Error('Provider did not confirm acceptance');
      record('contact.provider_accepted');
      return response(202, { message: 'Your inquiry was accepted for sending. Inbox delivery is not confirmed. If your request is urgent, call (612) 703-9119.' });
    } catch {
      record('contact.provider_unconfirmed');
      return response(502, { message: 'We could not confirm that your inquiry was accepted. Please try again with the same details, or email mplsmntowers@gmail.com. Inbox delivery is not confirmed.' });
    }
  };
}
