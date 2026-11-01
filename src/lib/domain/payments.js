// Orders and payments.
//
// An order is created as `pending` and unlocks nothing. The only way it becomes `paid` is `applyGatewayResult`, fed with
// an answer that the payment server gave after checking with the provider (see lib/payments/gateway.js). There is no
// "confirm" action a button can call. Everything here is pure: (db, ...args) => { ok, db, ... } | { ok: false, error }.
import { PAYMENT_KIND, PAYMENT_STATUS, PROGRAM_STATUS, SUBSCRIPTION_STATUS, DAY_MS } from '../constants.js';
import { hasGeneralAccess, isFreeProgram, subscriptionState } from '../access.js';
import { uid } from '../format.js';
import { canTransition } from '../transitions.js';
import { byId, fail, nowIso, ok, replaceById, withNotification } from './shared.js';

/** Resolves who is paid and how much for a checkout target, or an error code. The amount comes from the trainer's offer. */
function resolveTarget(db, athleteId, kind, targetId, now) {
  if (kind === PAYMENT_KIND.GENERAL) {
    const program = byId(db.programs, targetId);
    if (!program || program.status !== PROGRAM_STATUS.PUBLISHED) return { error: 'not_found' };
    if (isFreeProgram(program)) return { error: 'free_program' };
    if (hasGeneralAccess(db, athleteId, program)) return { error: 'already_owned' };
    return { trainerId: program.ownerId, amount: program.price };
  }
  const subscription = byId(db.subscriptions, targetId);
  if (!subscription || subscription.athleteId !== athleteId) return { error: 'forbidden' };
  const state = subscriptionState(subscription, now);
  if (kind === PAYMENT_KIND.COACHING && state === SUBSCRIPTION_STATUS.PENDING) return { trainerId: subscription.trainerId, amount: subscription.price };
  if (kind === PAYMENT_KIND.RENEWAL && [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.EXPIRED].includes(state)) {
    return { trainerId: subscription.trainerId, amount: subscription.renewalPrice }; // trainer-configured renewal price
  }
  return { error: 'invalid_state' };
}

/** The order that is waiting for payment for this target, if any. */
export const findOpenOrder = (db, athleteId, kind, targetId) =>
  db.payments.find((p) => p.athleteId === athleteId && p.kind === kind && p.targetId === targetId && p.status === PAYMENT_STATUS.PENDING);

/** True while the person has been sent to the gateway for this subscription: the trainer may not change the terms now. */
export const hasPaymentInProgress = (db, subscriptionId) =>
  db.payments.some((p) => p.targetId === subscriptionId && p.status === PAYMENT_STATUS.PENDING && p.gatewayRef);

const setStatus = (db, payment, status, extra, now) =>
  replaceById(db.payments, { ...payment, ...extra, status, updatedAt: nowIso(now) });

/**
 * Start (or resume) a checkout: creates a pending order. A second click returns the same order, so there is never
 * a duplicate. If the price changed since the open order was created, that order is cancelled and a new one made.
 */
export function startCheckout(db, athleteId, { kind, targetId }, now = Date.now()) {
  if (byId(db.users, athleteId)?.role !== 'athlete') return fail('forbidden');
  const target = resolveTarget(db, athleteId, kind, targetId, now);
  if (target.error) return fail(target.error);

  const open = findOpenOrder(db, athleteId, kind, targetId);
  if (open && open.amount === target.amount) return ok(db, { payment: open });

  const payments = open ? setStatus(db, open, PAYMENT_STATUS.CANCELLED, { failureReason: 'terms_changed' }, now) : db.payments;
  const payment = {
    id: uid(), kind, athleteId, trainerId: target.trainerId, targetId, amount: target.amount,
    status: PAYMENT_STATUS.PENDING, gateway: null, gatewayRef: null, failureReason: null,
    createdAt: nowIso(now), updatedAt: nowIso(now), paidAt: null,
  };
  return ok({ ...db, payments: [payment, ...payments] }, { payment });
}

/** The payment server opened a session for this order: remember its reference so the result can be matched later. */
export function attachGatewaySession(db, athleteId, paymentId, { gateway, gatewayRef }, now = Date.now()) {
  const payment = byId(db.payments, paymentId);
  if (!payment || payment.athleteId !== athleteId) return fail('forbidden');
  if (payment.status !== PAYMENT_STATUS.PENDING) return fail('invalid_transition');
  if (!gatewayRef || db.payments.some((p) => p.id !== payment.id && p.gatewayRef === gatewayRef)) return fail('reference_reused');
  return ok({ ...db, payments: setStatus(db, payment, PAYMENT_STATUS.PENDING, { gateway, gatewayRef }, now) });
}

/** The person gave up on this order. Closing the payment page does not do this; only an explicit cancel. */
export function cancelPayment(db, athleteId, paymentId, now = Date.now()) {
  const payment = byId(db.payments, paymentId);
  if (!payment || payment.athleteId !== athleteId) return fail('forbidden');
  if (!canTransition('payment', payment.status, PAYMENT_STATUS.CANCELLED)) return fail('invalid_transition');
  // Once the person was sent to the provider a payment may still complete there, so it is verified rather than dropped.
  if (payment.gatewayRef) return fail('payment_in_progress');
  return ok({ ...db, payments: setStatus(db, payment, PAYMENT_STATUS.CANCELLED, { failureReason: 'cancelled_by_user' }, now) });
}

const systemMessage = (conversation, systemKey, now) => ({ id: uid(), conversationId: conversation.id, kind: 'system', systemKey, createdAt: nowIso(now) });

/** Grants general access (derived from the paid order) or activates / renews the subscription. */
function activate(db, payment, now) {
  const athlete = byId(db.users, payment.athleteId);
  let next = { ...db, payments: setStatus(db, payment, PAYMENT_STATUS.PAID, { paidAt: nowIso(now), failureReason: null }, now) };

  if (payment.kind === PAYMENT_KIND.GENERAL) {
    const program = byId(db.programs, payment.targetId);
    return ok(withNotification(next, payment.trainerId, 'purchase', { athlete: athlete.name, program: program.title }, { kind: 'page', page: 'programs' }, now), { outcome: 'paid' });
  }

  const subscription = byId(db.subscriptions, payment.targetId);
  const conversation = db.conversations.find((c) => c.requestId === subscription.requestId);
  const state = subscriptionState(subscription, now);
  const isRenewal = payment.kind === PAYMENT_KIND.RENEWAL;
  const span = subscription.durationDays * DAY_MS;

  // Active renewal extends from the current end; a new or expired period starts now.
  const startAt = isRenewal && state === SUBSCRIPTION_STATUS.ACTIVE ? subscription.startAt : now;
  const endAt = (isRenewal && state === SUBSCRIPTION_STATUS.ACTIVE ? subscription.endAt : now) + span;
  const updated = {
    ...subscription,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    startAt,
    endAt,
    paymentIds: [...subscription.paymentIds, payment.id],
    renewalCount: subscription.renewalCount + (isRenewal ? 1 : 0),
  };
  next = { ...next, subscriptions: replaceById(next.subscriptions, updated) };
  if (conversation) next = { ...next, messages: [...next.messages, systemMessage(conversation, isRenewal ? 'chat.sys.renewed' : 'chat.sys.active', now)] };

  const type = isRenewal ? 'subscription_renewed' : 'subscription_active';
  return ok(withNotification(next, payment.trainerId, type, { athlete: athlete.name }, { kind: 'coaching', requestId: subscription.requestId }, now), { subscription: updated, outcome: 'paid' });
}

/**
 * Applies an answer from the payment server: { orderId, status: paid|failed|cancelled|pending, amount, gatewayRef }.
 * Safe to call any number of times with the same answer (a refresh, a double return from the gateway): a paid order is
 * never activated twice. A paid answer is refused unless it names this order's own gateway reference and the amount
 * the order was created with.
 * Returns ok with `outcome`: 'paid' | 'failed' | 'cancelled' | 'pending' | 'already_paid'.
 */
export function applyGatewayResult(db, athleteId, result, now = Date.now()) {
  const payment = byId(db.payments, result?.orderId);
  if (!payment || payment.athleteId !== athleteId) return fail('forbidden');

  if (payment.status === PAYMENT_STATUS.PAID) return result.status === 'paid' ? ok(db, { outcome: 'already_paid' }) : fail('invalid_transition');
  if (payment.status !== PAYMENT_STATUS.PENDING) return fail('invalid_transition'); // failed / cancelled orders stay closed
  if (!payment.gatewayRef) return fail('no_gateway_session'); // never sent to a provider, so nothing can have been paid
  if (result.gatewayRef !== payment.gatewayRef) return fail('reference_mismatch');

  if (result.status === 'pending') return ok(db, { outcome: 'pending' });
  if (result.status === 'failed' || result.status === 'cancelled') {
    const status = result.status === 'failed' ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.CANCELLED;
    return ok({ ...db, payments: setStatus(db, payment, status, { failureReason: result.status === 'failed' ? 'declined' : 'cancelled_at_gateway' }, now) }, { outcome: result.status });
  }
  if (result.status !== 'paid') return fail('bad_result');

  // The amount that was really paid must be the amount the order was created with (read from the trainer's offer).
  if (result.amount !== payment.amount) {
    return ok({ ...db, payments: setStatus(db, payment, PAYMENT_STATUS.FAILED, { failureReason: 'amount_mismatch', needsReview: true }, now) }, { outcome: 'failed', needsReview: true });
  }
  // Something unlocked it another way meanwhile (e.g. the period was already paid): do not activate a second time.
  const target = resolveTarget(db, athleteId, payment.kind, payment.targetId, now);
  const stale = target.error && !(payment.kind === PAYMENT_KIND.GENERAL && target.error === 'already_owned');
  if (stale) return ok({ ...db, payments: setStatus(db, payment, PAYMENT_STATUS.FAILED, { failureReason: target.error, needsReview: true }, now) }, { outcome: 'failed', needsReview: true });

  return activate(db, payment, now);
}
