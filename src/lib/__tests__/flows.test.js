// End-to-end checks of the marketplace rules, run against the pure domain functions:
//   node --test src/lib/__tests__/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { canStartProgram, chatState, hasCustomAccess, hasGeneralAccess, requestPhase, subscriptionState } from '../access.js';
import { DAY_MS, PHASE } from '../constants.js';
import { claimFreeProgram, deleteGeneralProgram, saveGeneralProgram, setProgramStatus } from '../domain/catalog.js';
import { acceptRequest, cancelRequest, rejectRequest, saveCustomProgram, sendMessage, submitRequest } from '../domain/coaching.js';
import { confirmPayment, failPayment, startCheckout } from '../domain/payments.js';
import { filterTrainers, getAthleteLibrary, getTrainerClients } from '../marketplace.js';
import { canTransition } from '../transitions.js';

const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const ATHLETE = 'ashkan';
const TRAINER = 'adel';
const form = { name: 'اشکان', age: 27, height: 182, weight: 84, goal: 'muscle', muscles: ['abs'], level: 'intermediate', daysPerWeek: 4, schedule: '', notes: '', photo: '' };
const offer = { price: 800000, renewalPrice: 500000, durationDays: 30 };
const draft = { title: 'برنامه اشکان', exercises: ['squat', 'pushup'], daysPerWeek: 4, durationWeeks: 4, offer };

/** Unwraps a successful domain result. */
const must = (result) => {
  assert.equal(result.ok, true, `expected ok, got ${result.error} ${JSON.stringify(result.fields ?? {})}`);
  return result;
};

/** Runs the whole path up to a published, unpaid custom program. */
function untilProposal(db = createSeedState()) {
  const { db: d1, request } = must(submitRequest(db, ATHLETE, TRAINER, form, NOW));
  const { db: d2 } = must(acceptRequest(d1, TRAINER, request.id, offer, NOW));
  const { db: d3, program } = must(saveCustomProgram(d2, TRAINER, request.id, draft, { publish: true }, NOW));
  return { db: d3, request: d3.requests.find((r) => r.id === request.id), program };
}

/** Pays the initial coaching price (initiate, then confirm). */
function activate(state) {
  const started = must(startCheckout(state.db, ATHLETE, { kind: 'coaching_initial', targetId: state.db.subscriptions[0].id }, NOW));
  return { ...state, db: must(confirmPayment(started.db, ATHLETE, started.payment.id, NOW)).db };
}

test('1. athletes can browse trainers and filter by location and specialty', () => {
  const db = createSeedState();
  const ids = (filters) => filterTrainers(db, filters).map((t) => t.id).sort();
  assert.equal(filterTrainers(db).length, 8, 'adel plus the seven sample trainers');
  assert.deepEqual(ids({ province: 'isfahan' }), ['kian']);
  assert.deepEqual(ids({ province: 'tehran', city: 'tehran-c' }), ['adel']);
  assert.deepEqual(ids({ focus: 'thighs' }), ['maryam']);
  assert.deepEqual(ids({ coachingOnly: true }), ['adel', 'kian', 'neda', 'reza', 'sara']);
  assert.deepEqual(ids({ province: 'razavi', focus: 'strength' }), ['reza']);
  assert.deepEqual(ids({ query: 'الهام' }), ['elham']);
});

test('2. a free general program is accessible without payment', () => {
  const db = createSeedState();
  const free = db.programs.find((p) => p.id === 'gp-beginner-full-body');
  assert.equal(hasGeneralAccess(db, ATHLETE, free), true);
  const next = must(claimFreeProgram(db, ATHLETE, free.id, NOW)).db;
  assert.equal(getAthleteLibrary(next, ATHLETE, NOW).free.length, 1);
  assert.equal(next.payments.length, 0);
});

test('3. a paid general program stays locked until the payment is confirmed', () => {
  const db = createSeedState();
  const paid = db.programs.find((p) => p.id === 'gp-six-pack');
  assert.equal(hasGeneralAccess(db, ATHLETE, paid), false);
  assert.equal(claimFreeProgram(db, ATHLETE, paid.id, NOW).error, 'payment_required');

  const { db: d1, payment } = must(startCheckout(db, ATHLETE, { kind: 'general_purchase', targetId: paid.id }, NOW));
  assert.equal(hasGeneralAccess(d1, ATHLETE, paid), false, 'initiating a payment must not unlock');
  const failed = must(failPayment(d1, ATHLETE, payment.id)).db;
  assert.equal(hasGeneralAccess(failed, ATHLETE, paid), false, 'a failed payment must not unlock');

  const retry = must(startCheckout(failed, ATHLETE, { kind: 'general_purchase', targetId: paid.id }, NOW));
  const paidDb = must(confirmPayment(retry.db, ATHLETE, retry.payment.id, NOW)).db;
  assert.equal(hasGeneralAccess(paidDb, ATHLETE, paid), true);
});

test('4. buying a general program does not create or activate coaching', () => {
  const db = createSeedState();
  const { db: d1, payment } = must(startCheckout(db, ATHLETE, { kind: 'general_purchase', targetId: 'gp-six-pack' }, NOW));
  const bought = must(confirmPayment(d1, ATHLETE, payment.id, NOW)).db;
  assert.equal(bought.requests.length, 0);
  assert.equal(bought.subscriptions.length, 0);
  assert.equal(bought.conversations.length, 0);
  const clients = getTrainerClients(bought, TRAINER, NOW);
  assert.equal(clients.active.length + clients.pending.length + clients.accepted.length, 0, 'a buyer is not a coaching client');
});

test('5. a coaching request validates, keeps optional fields optional, and starts as pending', () => {
  const db = createSeedState();
  const bad = submitRequest(db, ATHLETE, TRAINER, { ...form, goal: '', daysPerWeek: 9, height: 10 }, NOW);
  assert.equal(bad.error, 'validation');
  assert.deepEqual(Object.keys(bad.fields).sort(), ['daysPerWeek', 'goal', 'height']);

  const minimal = { name: 'اشکان', goal: 'muscle', level: 'beginner', daysPerWeek: 3 }; // no age/height/weight/photo
  const { request, db: next } = must(submitRequest(db, ATHLETE, TRAINER, minimal, NOW));
  assert.equal(request.status, 'pending');
  assert.equal(next.notifications[0].userId, TRAINER);
  assert.equal(next.notifications[0].type, 'request_new');
  assert.equal(submitRequest(next, ATHLETE, TRAINER, minimal, NOW).error, 'duplicate_request');
  assert.equal(submitRequest(db, ATHLETE, 'maryam', form, NOW).error, 'coaching_unavailable', 'trainer without coaching');
});

test('6/7. the trainer decides; chat is locked until acceptance', () => {
  const db = createSeedState();
  const { db: d1, request } = must(submitRequest(db, ATHLETE, TRAINER, form, NOW));
  assert.equal(chatState(d1, request, NOW), 'locked');
  assert.equal(acceptRequest(d1, 'kian', request.id, offer, NOW).error, 'forbidden', 'another trainer cannot decide');
  assert.equal(acceptRequest(d1, TRAINER, request.id, { price: 0 }, NOW).error, 'validation');

  const { db: d2 } = must(acceptRequest(d1, TRAINER, request.id, offer, NOW));
  const accepted = d2.requests[0];
  assert.equal(chatState(d2, accepted, NOW), 'open');
  const conversation = d2.conversations[0];
  assert.equal(sendMessage(d2, ATHLETE, conversation.id, 'سلام', NOW).ok, true);
  assert.equal(sendMessage(d2, 'mohammad', conversation.id, 'hi', NOW).error, 'forbidden', 'non-participants cannot write');

  // rejection: no chat, no program
  const { db: r1, request: r } = must(submitRequest(db, ATHLETE, TRAINER, form, NOW));
  const rejected = must(rejectRequest(r1, TRAINER, r.id, 'full', NOW)).db;
  assert.equal(chatState(rejected, rejected.requests[0], NOW), 'locked');
  assert.equal(saveCustomProgram(rejected, TRAINER, r.id, draft, { publish: true }, NOW).error, 'request_not_accepted');
  assert.equal(canTransition('request', 'rejected', 'accepted'), false);
  // an athlete can withdraw only while pending
  assert.equal(cancelRequest(d2, ATHLETE, request.id, NOW).error, 'invalid_transition');
});

test('8. the trainer builds a private program for that athlete only', () => {
  const { db, program } = untilProposal();
  assert.equal(program.athleteId, ATHLETE);
  assert.equal(program.kind, 'custom');
  assert.equal(db.programs.length, createSeedState().programs.length, 'a custom program never joins the public catalog');
  assert.equal(db.subscriptions[0].status, 'pending_payment');
  assert.equal(hasCustomAccess(db, 'bardia', program, NOW), false, 'another athlete has no access');
  assert.equal(saveCustomProgram(db, 'kian', program.requestId, draft, { publish: true }, NOW).error, 'forbidden', 'another trainer cannot edit it');
});

test('9/10. the custom program is locked until payment is confirmed, then the subscription activates', () => {
  const state = untilProposal();
  const sub = state.db.subscriptions[0];
  assert.equal(requestPhase(state.db, state.request, NOW), PHASE.AWAITING_PAYMENT);
  assert.equal(canStartProgram(state.db, state.db.users.find((u) => u.id === ATHLETE), state.program, NOW), false);

  const started = must(startCheckout(state.db, ATHLETE, { kind: 'coaching_initial', targetId: sub.id }, NOW));
  assert.equal(started.payment.amount, 800000);
  assert.equal(hasCustomAccess(started.db, ATHLETE, state.program, NOW), false, 'initiated is not confirmed');
  assert.equal(startCheckout(state.db, 'bardia', { kind: 'coaching_initial', targetId: sub.id }, NOW).ok, false);

  const confirmed = must(confirmPayment(started.db, ATHLETE, started.payment.id, NOW));
  const active = confirmed.db.subscriptions[0];
  assert.equal(active.status, 'active');
  assert.equal(active.startAt, NOW);
  assert.equal(active.endAt, NOW + 30 * DAY_MS);
  assert.equal(hasCustomAccess(confirmed.db, ATHLETE, state.program, NOW), true);
  assert.equal(confirmed.db.notifications[0].userId, TRAINER);
  assert.equal(confirmed.db.notifications[0].type, 'subscription_active');
  assert.equal(confirmPayment(confirmed.db, ATHLETE, started.payment.id, NOW).error, 'invalid_transition', 'cannot confirm twice');
});

test('11. the trainer reviews activity and edits only this athlete\'s program', () => {
  const state = activate(untilProposal());
  const before = state.db.programs.map((p) => p.exercises.join());
  const edited = must(saveCustomProgram(state.db, TRAINER, state.request.id, { ...draft, exercises: ['squat', 'pushup', 'plank'] }, {}, NOW + DAY_MS));
  assert.equal(edited.program.version, 2);
  assert.deepEqual(edited.program.exercises, ['squat', 'pushup', 'plank']);
  assert.deepEqual(edited.db.programs.map((p) => p.exercises.join()), before, 'general programs are untouched');
  assert.equal(edited.db.notifications[0].type, 'program_updated');
  assert.equal(edited.db.subscriptions[0].price, 800000, 'price is frozen after payment');
});

test('12. renewal uses the trainer-configured renewal price and duration', () => {
  const state = activate(untilProposal());
  const sub = state.db.subscriptions[0];
  const early = must(startCheckout(state.db, ATHLETE, { kind: 'coaching_renewal', targetId: sub.id }, NOW + 10 * DAY_MS));
  assert.equal(early.payment.amount, 500000, 'renewal price, not the initial price');
  const renewed = must(confirmPayment(early.db, ATHLETE, early.payment.id, NOW + 10 * DAY_MS)).db.subscriptions[0];
  assert.equal(renewed.endAt, NOW + 60 * DAY_MS, 'early renewal extends from the current end');
  assert.equal(renewed.renewalCount, 1);
  assert.equal(renewed.startAt, NOW);
});

test('13. expiry stops access but keeps every record; renewing restores it', () => {
  const state = activate(untilProposal());
  const later = NOW + 40 * DAY_MS;
  const sub = state.db.subscriptions[0];
  assert.equal(subscriptionState(sub, later), 'expired');
  assert.equal(hasCustomAccess(state.db, ATHLETE, state.program, later), false);
  assert.equal(requestPhase(state.db, state.request, later), PHASE.EXPIRED);
  assert.equal(chatState(state.db, state.request, later), 'readonly');
  assert.equal(sendMessage(state.db, ATHLETE, state.db.conversations[0].id, 'hi', later).error, 'chat_closed');
  assert.ok(state.db.messages.length > 0, 'conversation history is kept');
  assert.equal(state.db.payments.length, 1, 'purchase history is kept');
  assert.equal(getTrainerClients(state.db, TRAINER, later).renewals.length, 1);

  const renewal = must(startCheckout(state.db, ATHLETE, { kind: 'coaching_renewal', targetId: sub.id }, later));
  const renewed = must(confirmPayment(renewal.db, ATHLETE, renewal.payment.id, later)).db;
  assert.equal(hasCustomAccess(renewed, ATHLETE, state.program, later), true);
  assert.equal(renewed.subscriptions[0].endAt, later + 30 * DAY_MS, 'an expired subscription restarts now');
});

test('trainers manage only their own general programs; buyers keep access when unpublished', () => {
  const db = createSeedState();
  const own = db.programs.find((p) => p.id === 'gp-six-pack');
  assert.equal(saveGeneralProgram(db, 'kian', { ...own, title: 'x' }, 'published', NOW).error, 'forbidden');
  assert.equal(saveGeneralProgram(db, TRAINER, { ...own, exercises: [] }, 'published', NOW).error, 'validation');
  assert.equal(setProgramStatus(db, 'kian', own.id, 'draft', NOW).error, 'forbidden');

  const { db: d1, payment } = must(startCheckout(db, ATHLETE, { kind: 'general_purchase', targetId: own.id }, NOW));
  const d2 = must(confirmPayment(d1, ATHLETE, payment.id, NOW)).db;
  const unpublished = must(setProgramStatus(d2, TRAINER, own.id, 'draft', NOW)).db;
  const program = unpublished.programs.find((p) => p.id === own.id);
  assert.equal(hasGeneralAccess(unpublished, ATHLETE, program), false, 'unpublished programs are not served');
  assert.equal(deleteGeneralProgram(unpublished, TRAINER, own.id).error, 'has_customers');
});
