import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { getStudentStats } from '../analytics.js';
import { DAY_MS } from '../constants.js';
import { PROFILE_LIMITS, updateTrainerProfile } from '../domain/trainerProfile.js';
import { acceptRequest, saveCustomProgram, submitRequest } from '../domain/coaching.js';
import { startCheckout } from '../domain/payments.js';
import { settlePaid } from './helpers.js';

const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const TRAINER = 'adel';
const IMG = 'data:image/jpeg;base64,/9j/4AAQ';
const must = (r) => { assert.equal(r.ok, true, `expected ok, got ${r.error} ${JSON.stringify(r.fields ?? {})}`); return r; };

test('a trainer can save photo, banner, resume and album; they are kept and isolated per trainer', () => {
  const db = createSeedState();
  const row = { id: 'r1', kind: 'certificate', title: 'مربی درجه ۲', place: 'فدراسیون', year: 1400, text: '' };
  const saved = must(updateTrainerProfile(db, TRAINER, { avatar: IMG, banner: IMG, resume: [row], album: [{ id: 'a1', src: IMG, caption: 'باشگاه' }], specialties: ['strength', 'muscle'] })).db;
  const me = saved.users.find((u) => u.id === TRAINER);
  assert.equal(me.avatar, IMG);
  assert.equal(me.banner, IMG);
  assert.equal(me.resume[0].title, 'مربی درجه ۲');
  assert.equal(me.album[0].caption, 'باشگاه');
  assert.deepEqual(me.specialties, ['strength', 'muscle']);
  const other = saved.users.find((u) => u.role === 'coach' && u.id !== TRAINER);
  assert.equal(other.avatar, undefined, 'another trainer is untouched');
  // Saving only some keys keeps the rest.
  const again = must(updateTrainerProfile(saved, TRAINER, { bio: 'سلام' })).db.users.find((u) => u.id === TRAINER);
  assert.equal(again.banner, IMG);
  assert.equal(again.bio, 'سلام');
  // Removing a picture clears it.
  assert.equal(must(updateTrainerProfile(saved, TRAINER, { banner: '' })).db.users.find((u) => u.id === TRAINER).banner, '');
});

test('profile validation names the field: bad year, empty resume title, non-image, too many pictures, long bio', () => {
  const db = createSeedState();
  const bad = updateTrainerProfile(db, TRAINER, {
    bio: 'x'.repeat(PROFILE_LIMITS.bio + 1),
    experienceYears: -3,
    avatar: 'http://evil.example/a.png',
    resume: [{ id: 'r1', kind: 'work', title: '', place: 'باشگاه', year: 1400, text: '' }, { id: 'r2', kind: 'award', title: 'x', place: '', year: 12, text: '' }],
    album: Array.from({ length: PROFILE_LIMITS.album + 1 }, (_, i) => ({ id: `a${i}`, src: IMG, caption: '' })),
  });
  assert.equal(bad.error, 'validation');
  assert.equal(bad.fields.bio, 'too_long');
  assert.equal(bad.fields.experienceYears, 'invalid');
  assert.equal(bad.fields.avatar, 'invalid');
  assert.equal(bad.fields['resume.r1.title'], 'required');
  assert.equal(bad.fields['resume.r2.year'], 'invalid');
  assert.equal(bad.fields.album, 'too_many');
  assert.equal(updateTrainerProfile(db, TRAINER, { album: [{ id: 'z', src: 'javascript:1', caption: '' }] }).fields['album.z'], 'invalid');
});

test('completely blank resume rows are dropped, not reported', () => {
  const db = createSeedState();
  const saved = must(updateTrainerProfile(db, TRAINER, { resume: [{ id: 'r', kind: 'work', title: '  ', place: '', year: '', text: '' }] })).db;
  assert.deepEqual(saved.users.find((u) => u.id === TRAINER).resume, []);
});

test('athletes cannot use the trainer profile, and the saved state may not outgrow browser storage', () => {
  const db = createSeedState();
  assert.equal(updateTrainerProfile(db, 'ashkan', { bio: 'x' }).error, 'forbidden');
  const huge = `data:image/jpeg;base64,${'A'.repeat(PROFILE_LIMITS.storageChars)}`;
  assert.equal(updateTrainerProfile(db, TRAINER, { banner: huge }).error, 'storage_full');
});

test('student numbers come from paid subscriptions: each person once, active vs ever', () => {
  const db0 = createSeedState();
  assert.deepEqual(getStudentStats(db0, TRAINER, NOW), { active: 0, total: 0 });

  const form = { name: 'a', goal: 'muscle', level: 'beginner', daysPerWeek: 3, wantsMealPlan: false };
  const offer = { price: 800000, renewalPrice: 500000, durationDays: 30 };
  const draft = { title: 't', exercises: ['squat'], daysPerWeek: 3, durationWeeks: 4, offer };
  let db = db0;
  const pay = (athlete, at) => {
    const r1 = must(submitRequest(db, athlete, TRAINER, form, at));
    const r2 = must(acceptRequest(r1.db, TRAINER, r1.request.id, offer, at));
    const r3 = must(saveCustomProgram(r2.db, TRAINER, r1.request.id, draft, { publish: true }, at));
    const sub = r3.db.subscriptions.find((s) => s.requestId === r1.request.id);
    const started = must(startCheckout(r3.db, athlete, { kind: 'coaching_initial', targetId: sub.id }, at));
    db = settlePaid(started.db, athlete, started.payment.id, at);
  };
  pay('ashkan', NOW - 60 * DAY_MS); // expired by NOW
  pay('bardia', NOW - 5 * DAY_MS); // still running
  assert.deepEqual(getStudentStats(db, TRAINER, NOW), { active: 1, total: 2 });
  assert.deepEqual(getStudentStats(db, 'kian', NOW), { active: 0, total: 0 }, 'another trainer has none');
});
