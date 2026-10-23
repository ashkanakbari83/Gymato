// Custom coaching: request -> trainer decision -> chat -> private program -> subscription (payment is in payments.js).
import { FOCUS_AREAS, GOALS, LEVELS, PROGRAM_KIND, PROGRAM_STATUS, REQUEST_STATUS, SUBSCRIPTION_STATUS } from '../constants.js';
import { chatState, getCustomProgram, getSubscription, subscriptionState } from '../access.js';
import { uid } from '../format.js';
import { buildSessions } from '../programs.js';
import { canTransition } from '../transitions.js';
import { byId, fail, nowIso, ok, replaceById, withNotification } from './shared.js';

const between = (value, min, max) => Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max;
const blank = (value) => value === '' || value == null;

/** Field errors for the athlete's request form. Only goal, level, training days and name are required. */
export function validateRequestForm(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'required';
  if (!GOALS.includes(form.goal)) errors.goal = 'required';
  if (!LEVELS.includes(form.level)) errors.level = 'required';
  if (!Number.isInteger(Number(form.daysPerWeek)) || !between(form.daysPerWeek, 1, 7)) errors.daysPerWeek = 'invalid';
  if (!blank(form.age) && !between(form.age, 10, 100)) errors.age = 'invalid';
  if (!blank(form.height) && !between(form.height, 100, 250)) errors.height = 'invalid';
  if (!blank(form.weight) && !between(form.weight, 25, 300)) errors.weight = 'invalid';
  if ((form.notes ?? '').length > 1000) errors.notes = 'too_long';
  if ((form.schedule ?? '').length > 200) errors.schedule = 'too_long';
  if (!blank(form.photo) && !String(form.photo).startsWith('data:image/')) errors.photo = 'invalid';
  return errors;
}

/** Price and duration the trainer proposes. The renewal price is whatever the trainer configures. */
export function validateOffer(offer) {
  const errors = {};
  const price = Number(offer?.price);
  const renewal = Number(offer?.renewalPrice);
  if (!Number.isInteger(price) || price <= 0) errors.price = 'invalid';
  if (!Number.isInteger(renewal) || renewal <= 0) errors.renewalPrice = 'invalid';
  if (!Number.isInteger(Number(offer?.durationDays)) || !between(offer?.durationDays, 7, 365)) errors.durationDays = 'invalid';
  return errors;
}

const normalizeOffer = (offer) => ({
  price: Number(offer.price),
  renewalPrice: Number(offer.renewalPrice),
  durationDays: Number(offer.durationDays),
});

/** Athlete asks a trainer for custom coaching. Creates a `pending` request; nothing else is unlocked. */
export function submitRequest(db, athleteId, trainerId, form, now = Date.now()) {
  const athlete = byId(db.users, athleteId);
  const trainer = byId(db.users, trainerId);
  if (athlete?.role !== 'athlete') return fail('forbidden');
  if (trainer?.role !== 'coach' || !trainer.offersCoaching) return fail('coaching_unavailable');

  const errors = validateRequestForm(form);
  if (Object.keys(errors).length) return fail('validation', errors);

  const open = db.requests.some(
    (r) => r.athleteId === athleteId && r.trainerId === trainerId && [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED].includes(r.status),
  );
  if (open) return fail('duplicate_request');

  const request = {
    id: uid(),
    athleteId,
    trainerId,
    status: REQUEST_STATUS.PENDING,
    form: {
      name: form.name.trim(),
      age: blank(form.age) ? '' : Number(form.age),
      height: blank(form.height) ? '' : Number(form.height),
      weight: blank(form.weight) ? '' : Number(form.weight),
      goal: form.goal,
      muscles: (form.muscles ?? []).filter((m) => FOCUS_AREAS.includes(m)),
      level: form.level,
      daysPerWeek: Number(form.daysPerWeek),
      schedule: (form.schedule ?? '').trim(),
      notes: (form.notes ?? '').trim(),
      photo: form.photo || '',
    },
    offer: null,
    rejectionReason: '',
    createdAt: nowIso(now),
    decidedAt: null,
  };
  const next = withNotification({ ...db, requests: [request, ...db.requests] }, trainerId, 'request_new', { athlete: request.form.name }, { kind: 'coaching', requestId: request.id }, now);
  return ok(next, { request });
}

export function cancelRequest(db, athleteId, requestId, now = Date.now()) {
  const request = byId(db.requests, requestId);
  if (!request || request.athleteId !== athleteId) return fail('forbidden');
  if (!canTransition('request', request.status, REQUEST_STATUS.CANCELLED)) return fail('invalid_transition');
  const updated = { ...request, status: REQUEST_STATUS.CANCELLED, decidedAt: nowIso(now) };
  const next = withNotification({ ...db, requests: replaceById(db.requests, updated) }, request.trainerId, 'request_cancelled', { athlete: request.form.name }, null, now);
  return ok(next);
}

const systemMessage = (conversationId, systemKey, now) => ({ id: uid(), conversationId, kind: 'system', systemKey, createdAt: nowIso(now) });

/** Trainer accepts (with a proposed offer). Opens the conversation; nothing is paid or unlocked yet. */
export function acceptRequest(db, trainerId, requestId, offer, now = Date.now()) {
  const request = byId(db.requests, requestId);
  if (!request || request.trainerId !== trainerId) return fail('forbidden');
  if (!canTransition('request', request.status, REQUEST_STATUS.ACCEPTED)) return fail('invalid_transition');
  const errors = validateOffer(offer);
  if (Object.keys(errors).length) return fail('validation', errors);

  const updated = { ...request, status: REQUEST_STATUS.ACCEPTED, offer: normalizeOffer(offer), decidedAt: nowIso(now) };
  const conversation = { id: uid(), requestId, athleteId: request.athleteId, trainerId, createdAt: nowIso(now) };
  const trainer = byId(db.users, trainerId);
  const next = withNotification(
    {
      ...db,
      requests: replaceById(db.requests, updated),
      conversations: [conversation, ...db.conversations],
      messages: [...db.messages, systemMessage(conversation.id, 'chat.sys.accepted', now)],
    },
    request.athleteId, 'request_accepted', { trainer: trainer.name }, { kind: 'coaching', requestId }, now,
  );
  return ok(next, { conversation });
}

export function rejectRequest(db, trainerId, requestId, reason = '', now = Date.now()) {
  const request = byId(db.requests, requestId);
  if (!request || request.trainerId !== trainerId) return fail('forbidden');
  if (!canTransition('request', request.status, REQUEST_STATUS.REJECTED)) return fail('invalid_transition');
  const updated = { ...request, status: REQUEST_STATUS.REJECTED, rejectionReason: reason.trim().slice(0, 300), decidedAt: nowIso(now) };
  const trainer = byId(db.users, trainerId);
  const next = withNotification({ ...db, requests: replaceById(db.requests, updated) }, request.athleteId, 'request_rejected', { trainer: trainer.name }, { kind: 'coaching', requestId }, now);
  return ok(next);
}

/** Errors for a custom program draft. The offer is only mandatory when publishing a proposal. */
export function validateCustomProgram(draft, { needsOffer }) {
  const errors = {};
  if (!draft.title?.trim()) errors.title = 'required';
  if (!draft.exercises?.length) errors.exercises = 'required';
  if (!between(draft.daysPerWeek, 1, 7)) errors.daysPerWeek = 'invalid';
  if (!between(draft.durationWeeks, 1, 52)) errors.durationWeeks = 'invalid';
  if (needsOffer) Object.assign(errors, validateOffer(draft.offer));
  return errors;
}

/**
 * Trainer saves the athlete's private program. `publish: true` turns a draft into a proposal
 * (creating the pending subscription and notifying the athlete). After publication, edits apply to this
 * athlete's copy only (version +1); price and duration are frozen once payment happened, the renewal price is not.
 */
export function saveCustomProgram(db, trainerId, requestId, draft, { publish = false } = {}, now = Date.now()) {
  const request = byId(db.requests, requestId);
  if (!request || request.trainerId !== trainerId) return fail('forbidden');
  if (request.status !== REQUEST_STATUS.ACCEPTED) return fail('request_not_accepted');

  const existing = getCustomProgram(db, requestId);
  if (existing && existing.trainerId !== trainerId) return fail('forbidden');
  const subscription = getSubscription(db, requestId);
  const state = subscriptionState(subscription, now);
  const paidBefore = state === SUBSCRIPTION_STATUS.ACTIVE || state === SUBSCRIPTION_STATUS.EXPIRED;
  const willBePublished = publish || existing?.status === PROGRAM_STATUS.PUBLISHED;

  // Offer terms: editable until paid; afterwards only the renewal price may change.
  const baseOffer = subscription ? { price: subscription.price, renewalPrice: subscription.renewalPrice, durationDays: subscription.durationDays } : request.offer;
  const offer = { ...(baseOffer ?? {}), ...(draft.offer ?? {}) };
  if (paidBefore) Object.assign(offer, { price: subscription.price, durationDays: subscription.durationDays });

  const errors = validateCustomProgram({ ...draft, offer }, { needsOffer: willBePublished });
  if (Object.keys(errors).length) return fail('validation', errors);

  const exercises = [...draft.exercises];
  const program = {
    ...(existing ?? {}),
    id: existing?.id ?? uid(),
    kind: PROGRAM_KIND.CUSTOM,
    requestId,
    trainerId,
    athleteId: request.athleteId,
    title: draft.title.trim(),
    notes: (draft.notes ?? '').trim(),
    safety: (draft.safety ?? '').trim(),
    daysPerWeek: Number(draft.daysPerWeek),
    durationWeeks: Number(draft.durationWeeks),
    exercises,
    targets: { ...(draft.targets ?? {}) },
    sessions: buildSessions(draft.sessions ?? existing?.sessions, exercises),
    status: willBePublished ? PROGRAM_STATUS.PUBLISHED : PROGRAM_STATUS.DRAFT,
    version: existing ? (existing.status === PROGRAM_STATUS.PUBLISHED ? existing.version + 1 : existing.version) : 1,
    createdAt: existing?.createdAt ?? nowIso(now),
    updatedAt: nowIso(now),
  };
  if (existing && !canTransition('program', existing.status, program.status) && existing.status !== program.status) return fail('invalid_transition');

  let next = {
    ...db,
    customPrograms: existing ? replaceById(db.customPrograms, program) : [program, ...db.customPrograms],
    // Keep the request's latest valid proposal in sync (an incomplete draft offer is not stored).
    requests: Object.keys(validateOffer(offer)).length ? db.requests : replaceById(db.requests, { ...request, offer: normalizeOffer(offer) }),
  };

  const trainer = byId(db.users, trainerId);
  if (publish && !subscription) {
    const created = {
      id: uid(), requestId, athleteId: request.athleteId, trainerId, customProgramId: program.id,
      status: SUBSCRIPTION_STATUS.PENDING, price: Number(offer.price), renewalPrice: Number(offer.renewalPrice),
      durationDays: Number(offer.durationDays), startAt: null, endAt: null, paymentIds: [], renewalCount: 0, createdAt: nowIso(now),
    };
    next = withNotification({ ...next, subscriptions: [created, ...next.subscriptions] }, request.athleteId, 'program_ready', { trainer: trainer.name, program: program.title }, { kind: 'coaching', requestId }, now);
  } else if (subscription) {
    const terms = paidBefore
      ? { renewalPrice: Number(offer.renewalPrice) }
      : { price: Number(offer.price), renewalPrice: Number(offer.renewalPrice), durationDays: Number(offer.durationDays) };
    next = { ...next, subscriptions: replaceById(next.subscriptions, { ...subscription, ...terms }) };
    if (state === SUBSCRIPTION_STATUS.ACTIVE) {
      next = withNotification(next, request.athleteId, 'program_updated', { trainer: trainer.name, program: program.title }, { kind: 'coaching', requestId }, now);
    }
  }
  return ok(next, { program });
}

/** Athlete <-> trainer message. Only participants, and only while the chat policy allows writing. */
export function sendMessage(db, userId, conversationId, text, now = Date.now()) {
  const conversation = byId(db.conversations, conversationId);
  if (!conversation || ![conversation.athleteId, conversation.trainerId].includes(userId)) return fail('forbidden');
  const request = byId(db.requests, conversation.requestId);
  if (chatState(db, request, now) !== 'open') return fail('chat_closed');
  const body = (text ?? '').trim();
  if (!body || body.length > 2000) return fail('invalid_message');

  const message = { id: uid(), conversationId, kind: 'text', senderId: userId, text: body, createdAt: nowIso(now) };
  let next = { ...db, messages: [...db.messages, message] };

  // One unread "new message" notification per conversation is enough.
  const receiver = userId === conversation.athleteId ? conversation.trainerId : conversation.athleteId;
  const alreadyNotified = db.notifications.some((n) => n.userId === receiver && !n.read && n.type === 'message_new' && n.target?.requestId === request.id);
  if (!alreadyNotified) {
    next = withNotification(next, receiver, 'message_new', { name: byId(db.users, userId).name }, { kind: 'coaching', requestId: request.id }, now);
  }
  return ok(next, { message });
}
