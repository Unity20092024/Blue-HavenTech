export const businessEmail = 'mplsmntowers@gmail.com';
export const interests = [
  'Advertising & marketing strategy',
  'Digital presence & experiences',
  'Connection-focused marketing',
  'Practical technology direction',
  'Let’s explore the possibilities',
] as const;

export interface Inquiry {
  name: string;
  email: string;
  company: string;
  interest: string;
  message: string;
  consent: true;
  website: string;
  submissionId: string;
}

const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isEmail = (value: string) => value.length <= 254 && emailPattern.test(value);

export function validateInquiry(input: unknown): { inquiry?: Inquiry; errors: Record<string, string> } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { form: 'Please check your inquiry and try again.' } };
  const raw = input as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const text = (key: string, min: number, max: number, multiline = false) => {
    const value = typeof raw[key] === 'string' ? raw[key].trim() : '';
    // Reject control characters in form data; allow line breaks only in messages.
    // eslint-disable-next-line no-control-regex
    const controls = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/;
    if (typeof raw[key] !== 'string' || value.length < min || value.length > max || controls.test(value)) errors[key] = `Please check the ${key} field (${min}–${max} characters).`;
    return value;
  };
  const inquiry = {
    name: text('name', 1, 120), email: text('email', 3, 254), company: text('company', 0, 180),
    interest: text('interest', 1, 100), message: text('message', 10, 5000, true),
    website: text('website', 0, 200), submissionId: text('submissionId', 36, 36), consent: raw.consent === true,
  };
  if (!isEmail(inquiry.email)) errors.email = 'Please enter a valid email address.';
  if (!interests.includes(inquiry.interest as typeof interests[number])) errors.interest = 'Please choose one of the listed services.';
  if (inquiry.consent !== true) errors.consent = 'Please agree to use of your information to respond to this inquiry.';
  if (!uuidPattern.test(inquiry.submissionId)) errors.form = 'Please reload this page before trying again.';
  if (Object.keys(raw).some(key => !Object.hasOwn(inquiry, key))) errors.form = 'Please reload this page and try again.';
  return Object.keys(errors).length ? { errors } : { errors, inquiry: inquiry as Inquiry };
}
