// Simulated payments. A payment attempt ("initiated") unlocks nothing; only `confirmPayment` does.
// In production the confirmation would come from the payment provider's server, not from the client.
import { PAYMENT_KIND, PAYMENT_STATUS, PROGRAM_STATUS, SUBSCRIPTION_STATUS, DAY_MS } from '../constants.js';
import { hasGeneralAccess, isFreeProgram, subscriptionState } from '../access.js';
import { uid } from '../format.js';
import { canTransition } from '../transitions.js';
import { byId, fail, nowIso, ok, replaceById, withNotification } from './shared.js';

/** Resolves who is paid and how much for a checkout target, or an error code. */
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

/** Start (or resume) a checkout. Reuses an open attempt unless the price changed since. */
export function startCheckout(db, athleteId, { kind, targetId }, now = Date.now()) {
  if (byId(db.users, athleteId)?.role !== 'athlete') return fail('forbidden');
  const target = resolveTarget(db, athleteId, kind, targetId, now);
  if (target.error) return fail(target.error);

  const open = db.payments.find((p) => p.athleteId === athleteId && p.kind === kind && p.targetId === targetId && p.status === PAYMENT_STATUS.INITIATED);
  if (open && open.amount === target.amount) return ok(db, { payment: open });

  const payments = open ? replaceById(db.payments, { ...open, status: PAYMENT_STATUS.FAILED }) : db.payments;
  const payment = { id: uid(), kind, athleteId, trainerId: target.trainerId, targetId, amount: target.amount, status: PAYMENT_STATUS.INITIATED, demo: true, createdAt: nowIso(now), confirmedAt: null };
  return ok({ ...db, payments: [payment, ...payments] }, { payment });
}

const systemMessage = (conversation, systemKey, now) => ({ id: uid(), conversationId: conversation.id, kind: 'system', systemKey, createdAt: nowIso(now) });

/** Applies a confirmed payment: grants general access (derived) or activates / renews the subscription. */
export function confirmPayment(db, athleteId, paymentId, now = Date.now()) {
  const payment = byId(db.payments, paymentId);
  if (!payment || payment.athleteId !== athleteId) return fail('forbidden');
  if (!canTransition('payment', payment.status, PAYMENT_STATUS.CONFIRMED)) return fail('invalid_transition');

  // The amount must still match the current terms (the trainer may have changed them meanwhile).
  const target = resolveTarget(db, athleteId, payment.kind, payment.targetId, now);
  if (target.error && payment.kind !== PAYMENT_KIND.GENERAL) return fail(target.error);
  if (payment.kind === PAYMENT_KIND.GENERAL && target.error && target.error !== 'already_owned') return fail(target.error);
  if (!target.error && target.amount !== payment.amount) return fail('price_changed');

  const athlete = byId(db.users, athleteId);
  let next = { ...db, payments: replaceById(db.payments, { ...payment, status: PAYMENT_STATUS.CONFIRMED, confirmedAt: nowIso(now) }) };

  if (payment.kind === PAYMENT_KIND.GENERAL) {
    const program = byId(db.programs, payment.targetId);
    return ok(withNotification(next, payment.trainerId, 'purchase', { athlete: athlete.name, program: program.title }, { kind: 'page', page: 'programs' }, now));
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
  return ok(withNotification(next, payment.trainerId, type, { athlete: athlete.name }, { kind: 'coaching', requestId: subscription.requestId }, now), { subscription: updated });
}

/** A failed or abandoned attempt. Nothing is unlocked. */
export function failPayment(db, athleteId, paymentId) {
  const payment = byId(db.payments, paymentId);
  if (!payment || payment.athleteId !== athleteId) return fail('forbidden');
  if (!canTransition('payment', payment.status, PAYMENT_STATUS.FAILED)) return fail('invalid_transition');
  return ok({ ...db, payments: replaceById(db.payments, { ...payment, status: PAYMENT_STATUS.FAILED }) });
}
