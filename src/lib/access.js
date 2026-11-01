// Access rules. Everything that unlocks content goes through these functions, so the rules are
// enforced in logic (not only by hiding buttons). NOTE: localStorage is not a security boundary;
// a real backend must repeat these checks.
import { PAYMENT_KIND, PAYMENT_STATUS, PHASE, PROGRAM_KIND, PROGRAM_STATUS, REQUEST_STATUS, SUBSCRIPTION_STATUS } from './constants.js';

export const getSubscription = (db, requestId) => db.subscriptions.find((s) => s.requestId === requestId) ?? null;
export const getCustomProgram = (db, requestId) => db.customPrograms.find((p) => p.requestId === requestId) ?? null;

/** Subscription status including time-based expiry (expiry is derived, never silently stored). */
export function subscriptionState(subscription, now = Date.now()) {
  if (!subscription) return null;
  if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE && subscription.endAt <= now) return SUBSCRIPTION_STATUS.EXPIRED;
  return subscription.status;
}

const confirmedPayment = (db, predicate) =>
  db.payments.some((p) => p.status === PAYMENT_STATUS.PAID && predicate(p));

export const isFreeProgram = (program) => Number(program.price) === 0;

/** General program: free, or paid with a confirmed payment. Owners can always open their own. */
export function hasGeneralAccess(db, userId, program) {
  if (!program) return false;
  if (program.ownerId === userId) return true;
  if (program.status !== PROGRAM_STATUS.PUBLISHED) return false;
  if (isFreeProgram(program)) return true;
  return confirmedPayment(db, (p) => p.kind === PAYMENT_KIND.GENERAL && p.targetId === program.id && p.athleteId === userId);
}

/** Custom program: only its athlete, published, with an active subscription backed by a confirmed payment. */
export function hasCustomAccess(db, userId, program, now = Date.now()) {
  if (!program) return false;
  if (program.trainerId === userId) return true;
  if (program.athleteId !== userId || program.status !== PROGRAM_STATUS.PUBLISHED) return false;
  const subscription = db.subscriptions.find((s) => s.customProgramId === program.id);
  if (subscriptionState(subscription, now) !== SUBSCRIPTION_STATUS.ACTIVE) return false;
  return confirmedPayment(db, (p) => subscription.paymentIds.includes(p.id));
}

export const canUseProgram = (db, userId, program, now = Date.now()) =>
  program?.kind === PROGRAM_KIND.CUSTOM ? hasCustomAccess(db, userId, program, now) : hasGeneralAccess(db, userId, program);

/** Can the athlete *start* the program (the trainer previewing their own work cannot log workouts as a client). */
export const canStartProgram = (db, user, program, now = Date.now()) =>
  user.role === 'athlete' && canUseProgram(db, user.id, program, now);

/** Where a coaching relationship stands, combining request + subscription state. */
export function requestPhase(db, request, now = Date.now()) {
  if (request.status !== REQUEST_STATUS.ACCEPTED) return request.status; // pending | rejected | cancelled
  const state = subscriptionState(getSubscription(db, request.id), now);
  if (!state) return PHASE.PREPARING;
  if (state === SUBSCRIPTION_STATUS.PENDING) return PHASE.AWAITING_PAYMENT;
  if (state === SUBSCRIPTION_STATUS.ACTIVE) return PHASE.ACTIVE;
  if (state === SUBSCRIPTION_STATUS.EXPIRED) return PHASE.EXPIRED;
  return REQUEST_STATUS.CANCELLED;
}

/**
 * Chat policy: locked until the trainer accepts; open while the arrangement is being agreed and
 * while the subscription is active; read-only (history kept) once the subscription has expired.
 */
export function chatState(db, request, now = Date.now()) {
  if (request.status !== REQUEST_STATUS.ACCEPTED) return 'locked';
  const state = subscriptionState(getSubscription(db, request.id), now);
  return state === SUBSCRIPTION_STATUS.EXPIRED || state === SUBSCRIPTION_STATUS.CANCELLED ? 'readonly' : 'open';
}
