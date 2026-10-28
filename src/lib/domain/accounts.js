// Accounts: sign-up and sign-in against db.users. Pure like the other domain functions.
import { MIN_PASSWORD_LENGTH, createCredentials, hasAccount, looksLikePhone, normalizePhone, passwordMatches } from '../auth.js';
import { makePublicId, uid } from '../format.js';
import { fail, ok } from './shared.js';

/**
 * Accounts that match what was typed. The identifier is a mobile number or a username (the starter admin
 * accounts share the username "admin", so more than one account can match; the caller lets the person pick).
 */
export function findAccounts(db, identifier, password) {
  const text = String(identifier ?? '').trim();
  if (!text || !password) return [];
  const phone = looksLikePhone(text) ? normalizePhone(text) : '';
  const username = text.toLowerCase();
  return db.users.filter(
    (u) => hasAccount(u) && (phone ? u.phone === phone : u.username?.toLowerCase() === username) && passwordMatches(u, password),
  );
}

/** Marks the person as signed in as `userId` (the account must exist and be able to sign in). */
export function signInAs(db, userId) {
  const user = db.users.find((u) => u.id === userId);
  if (!hasAccount(user)) return fail('not_found');
  return ok({ ...db, signedIn: true, activeUser: user.id });
}

export const signOut = (db) => ok({ ...db, signedIn: false });

/**
 * Creates an account from the sign-up form and signs it in. Errors come back as field codes:
 * required | invalid | duplicate | too_short.
 */
export function registerAccount(db, form) {
  const errors = {};
  const name = String(form.name ?? '').trim();
  const phone = normalizePhone(form.phone);
  const password = String(form.password ?? '');

  if (!name) errors.name = 'required';
  if (!String(form.phone ?? '').trim()) errors.phone = 'required';
  else if (!phone) errors.phone = 'invalid';
  else if (db.users.some((u) => u.phone === phone)) errors.phone = 'duplicate';
  if (!password) errors.password = 'required';
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = 'too_short';
  if (Object.keys(errors).length) return fail('validation', errors);

  const role = form.role === 'coach' ? 'coach' : 'athlete';
  const user = {
    id: uid(),
    name,
    phone,
    ...createCredentials(password),
    role,
    roles: [role],
    isAdmin: false,
    publicId: makePublicId(db.users),
    province: form.province || '',
    city: form.city || '',
    ...(role === 'coach'
      ? { specialties: [], bio: '', experienceYears: 0, offersCoaching: true }
      : { age: Number(form.age) || '', height: Number(form.height) || '', weight: Number(form.weight) || '', goal: form.goal, level: form.level }),
  };
  return ok({ ...db, users: [...db.users, user], signedIn: true, activeUser: user.id }, { user });
}
