// Sign-in, sign-up, starter accounts and the sample community.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { hasAccount, normalizePhone, passwordMatches } from '../auth.js';
import { findAccounts, registerAccount, signInAs, signOut } from '../domain/accounts.js';
import { getProgramStats, getTrainerReviews, ratingOf } from '../analytics.js';
import { getPublishedPrograms } from '../marketplace.js';
import { loadState } from '../storage.js';

const must = (r) => { assert.equal(r.ok, true, `expected ok, got ${r.error} ${JSON.stringify(r.fields ?? {})}`); return r; };
const form = { name: 'سارا', phone: '09121234567', password: 'secret1', role: 'athlete', province: '', city: '', goal: 'fitness', level: 'beginner' };

test('only the four starter accounts can sign in, and all of them are admins with admin / admin', () => {
  const db = createSeedState();
  const accounts = db.users.filter(hasAccount);
  assert.deepEqual(accounts.map((u) => u.name), ['اشکان', 'عادل', 'بردیا', 'محمد']);
  for (const user of accounts) {
    assert.equal(user.isAdmin, true);
    assert.equal(user.username, 'admin');
    assert.equal(passwordMatches(user, 'admin'), true);
    assert.equal(passwordMatches(user, 'wrong'), false);
    assert.equal(JSON.stringify(user).includes('"password"'), false, 'no plain-text password is stored');
  }
  assert.equal(db.signedIn, false, 'the app starts signed out');
});

test('admin / admin matches all four accounts (the person picks one); wrong passwords match none', () => {
  const db = createSeedState();
  assert.equal(findAccounts(db, 'admin', 'admin').length, 4);
  assert.equal(findAccounts(db, ' ADMIN ', 'admin').length, 4, 'username ignores case and spaces');
  assert.equal(findAccounts(db, 'admin', 'Admin').length, 0, 'password is case sensitive');
  assert.equal(findAccounts(db, 'admin', '').length, 0);
  assert.equal(findAccounts(db, '', 'admin').length, 0);
});

test('sample trainers and reviewers are listing-only: they cannot sign in', () => {
  const db = createSeedState();
  const people = db.users.filter((u) => u.demo);
  assert.ok(people.length >= 15);
  assert.equal(people.some(hasAccount), false);
  assert.equal(findAccounts(db, 'admin', 'admin').some((u) => u.demo), false);
  assert.equal(signInAs(db, 'kian').error, 'not_found');
});

test('sign up with a mobile number and password, then sign in with it', () => {
  const db = createSeedState();
  const { db: next, user } = must(registerAccount(db, { ...form, phone: '۰۹۱۲۱۲۳۴۵۶۷' }));
  assert.equal(user.phone, '09121234567', 'Persian digits are normalised');
  assert.equal(user.isAdmin, false);
  assert.equal(next.signedIn, true);
  assert.equal(next.activeUser, user.id);
  assert.notEqual(user.passwordHash, 'secret1');

  const out = must(signOut(next)).db;
  assert.equal(out.signedIn, false);
  assert.equal(findAccounts(out, '0912 123 4567', 'secret1')[0]?.id, user.id, 'sign in by phone (spaces allowed)');
  assert.equal(findAccounts(out, '+98 912 123 4567', 'secret1')[0]?.id, user.id, 'sign in by +98 format');
  assert.equal(findAccounts(out, '09121234567', 'nope').length, 0);
  assert.equal(must(signInAs(out, user.id)).db.signedIn, true);
});

test('sign-up validation: required fields, phone format, duplicates, short passwords', () => {
  const db = createSeedState();
  assert.deepEqual(registerAccount(db, { ...form, name: ' ', phone: '', password: '' }).fields, { name: 'required', phone: 'required', password: 'required' });
  assert.equal(registerAccount(db, { ...form, phone: '12345' }).fields.phone, 'invalid');
  assert.equal(registerAccount(db, { ...form, password: '12345' }).fields.password, 'too_short');
  const taken = must(registerAccount(db, form)).db;
  assert.equal(registerAccount(taken, { ...form, name: 'دیگری', phone: '+989121234567' }).fields.phone, 'duplicate');
  assert.equal(registerAccount(taken, form).ok, false);
});

test('new trainers get an empty public profile; phone parsing handles the common formats', () => {
  const db = createSeedState();
  const { user } = must(registerAccount(db, { ...form, role: 'coach' }));
  assert.equal(user.role, 'coach');
  assert.deepEqual(user.specialties, []);
  assert.equal(normalizePhone('09123456789'), '09123456789');
  assert.equal(normalizePhone('9123456789'), '09123456789');
  assert.equal(normalizePhone('0098 912 345 6789'), '09123456789');
  assert.equal(normalizePhone('0812345678'), '');
});

test('the sample community covers the different cases the marketplace has to show', () => {
  const db = createSeedState();
  const trainer = (id) => db.users.find((u) => u.id === id);
  const programsOf = (id) => getPublishedPrograms(db, id);
  const ratingOfTrainer = (id) => ratingOf(getTrainerReviews(db, id));

  assert.equal(programsOf('neda').length, 0, 'a new trainer with no programs');
  assert.equal(ratingOfTrainer('neda').count, 0);
  assert.equal(trainer('hamed').province, '', 'a trainer without a location');
  assert.equal(trainer('hamed').bio, '');
  assert.ok(programsOf('hamed').every((p) => p.price === 0), 'only free programs');
  assert.equal(trainer('maryam').offersCoaching, false);
  assert.equal(db.programs.find((p) => p.id === 'gp-maryam-glute-draft').status, 'draft');
  assert.equal(programsOf('maryam').some((p) => p.id === 'gp-maryam-glute-draft'), false, 'drafts are not listed');

  const prices = db.programs.map((p) => p.price);
  assert.ok(prices.includes(0) && prices.some((p) => p > 0 && p < 200000) && prices.some((p) => p >= 1000000), 'free, cheap and expensive');
  assert.ok(db.reviews.some((r) => r.rating <= 2 && r.text), 'a critical review');
  assert.ok(db.reviews.some((r) => r.rating === 5 && !r.text), 'a rating without a comment');
  assert.ok(ratingOfTrainer('elham').avg < ratingOfTrainer('kian').avg, 'mixed vs strong reviews');
  assert.ok(getProgramStats(db, 'gp-sara-morning').likes >= 5);
});

test('every review, like and program points at someone who exists', () => {
  const db = createSeedState();
  const users = new Set(db.users.map((u) => u.id));
  const programs = new Set(db.programs.map((p) => p.id));
  const exercises = new Set(db.exercises.map((e) => e.id));
  for (const r of db.reviews) assert.ok(users.has(r.athleteId) && users.has(r.trainerId) && programs.has(r.targetId), r.id);
  for (const l of db.likes) assert.ok(users.has(l.athleteId) && users.has(l.trainerId) && programs.has(l.programId), l.id);
  for (const p of db.programs) {
    assert.ok(users.has(p.ownerId), p.id);
    assert.ok(p.exercises.every((id) => exercises.has(id)), `${p.id} uses unknown exercises`);
    assert.ok(p.sessions.flatMap((s) => s.items).every((id) => p.exercises.includes(id)), p.id);
  }
  assert.equal(new Set(db.users.map((u) => u.publicId)).size, db.users.length, 'public ids are unique');
  assert.equal(new Set(db.reviews.map((r) => r.id)).size, db.reviews.length);
});

test('saved data from the earlier version is replaced by the starter accounts but keeps preferences', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const old = createSeedState();
  store.set('jimato:state:v5', JSON.stringify({ ...old, version: 5, theme: 'dark', language: 'en', users: [{ id: 'old' }], sessions: [{ id: 's1', userId: 'ashkan' }, { id: 's2', userId: 'old' }] }));
  const state = loadState();
  assert.equal(state.version, 6);
  assert.equal(state.theme, 'dark');
  assert.equal(state.language, 'en');
  assert.equal(state.signedIn, false);
  assert.deepEqual(state.sessions.map((s) => s.id), ['s1']);
  assert.equal(state.users.some((u) => u.id === 'old'), false);
  delete globalThis.localStorage;
});
