import { createContactHandler } from '../server/contact.ts';

// Native Vercel Node.js Web handler. Credentials are only read on the server.
export default { fetch: createContactHandler() };
