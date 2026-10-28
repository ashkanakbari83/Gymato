// Sign-in helpers: phone numbers, password hashing and matching.
// NOTE: everything lives in the browser (localStorage), so this keeps passwords from being stored as plain
// text but is not a security boundary. A real backend must repeat all of these checks.
import { sha256 } from './sha256.js';

export const MIN_PASSWORD_LENGTH = 6;

const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC = '٠١٢٣٤٥٦٧٨٩';

/** Latin digits only, whatever keyboard the number was typed on. */
export const toLatinDigits = (text) =>
  String(text ?? '')
    .replace(/[۰-۹]/g, (d) => PERSIAN.indexOf(d))
    .replace(/[٠-٩]/g, (d) => ARABIC.indexOf(d));

/**
 * Iranian mobile number as 09XXXXXXXXX. Accepts Persian/Arabic digits, spaces, dashes and the +98 / 0098 / 98
 * prefixes. Returns '' when the text is not a mobile number.
 */
export function normalizePhone(text) {
  let digits = toLatinDigits(text).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('0098')) digits = digits.slice(4);
  else if (digits.startsWith('98') && digits.length === 12) digits = digits.slice(2);
  if (/^9\d{9}$/.test(digits)) digits = `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : '';
}

export const looksLikePhone = (text) => /^[+\d۰-۹٠-٩][\d۰-۹٠-٩\s\-().+]*$/.test(String(text).trim());

export const makeSalt = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
export const hashPassword = (salt, password) => sha256(`${salt}:${password}`);

/** { salt, passwordHash } for a new password. */
export function createCredentials(password, salt = makeSalt()) {
  return { salt, passwordHash: hashPassword(salt, password) };
}

export const passwordMatches = (user, password) =>
  Boolean(user?.passwordHash) && hashPassword(user.salt, password) === user.passwordHash;

/** An account can sign in; "listing-only" demo people (the sample trainers and reviewers) cannot. */
export const hasAccount = (user) => Boolean(user?.passwordHash);

/** What the app may keep about a user in the UI: never the hash or salt. */
export const publicUser = ({ passwordHash, salt, ...rest }) => rest; // eslint-disable-line no-unused-vars
