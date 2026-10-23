// Marketplace selectors: trainer discovery, athlete library and trainer dashboards.
import { PAYMENT_KIND, PAYMENT_STATUS, PHASE, PROGRAM_STATUS, DAY_MS } from './constants.js';
import { getCustomProgram, getSubscription, requestPhase, subscriptionState } from './access.js';

export const getCoaches = (db) => db.users.filter((u) => u.role === 'coach');
export const getUser = (db, id) => db.users.find((u) => u.id === id) ?? null;

export const getPublishedPrograms = (db, trainerId) =>
  db.programs.filter((p) => p.ownerId === trainerId && p.status === PROGRAM_STATUS.PUBLISHED);
export const getOwnPrograms = (db, trainerId) => db.programs.filter((p) => p.ownerId === trainerId);

/** Trainer discovery. Filters are all optional; `focus` matches the trainer's specialties. */
export function filterTrainers(db, { query = '', province = '', city = '', focus = '', coachingOnly = false } = {}) {
  const q = query.trim().toLowerCase();
  return getCoaches(db).filter(
    (trainer) =>
      (!province || trainer.province === province) &&
      (!city || trainer.city === city) &&
      (!focus || trainer.specialties?.includes(focus)) &&
      (!coachingOnly || trainer.offersCoaching) &&
      (!q || trainer.name.toLowerCase().includes(q) || (trainer.bio ?? '').toLowerCase().includes(q)),
  );
}

/** Distinct confirmed buyers of a paid general program (they are customers, not coaching clients). */
export function getBuyers(db, programId) {
  const ids = new Set(
    db.payments
      .filter((p) => p.kind === PAYMENT_KIND.GENERAL && p.targetId === programId && p.status === PAYMENT_STATUS.CONFIRMED)
      .map((p) => p.athleteId),
  );
  return db.users.filter((u) => ids.has(u.id));
}

export const getMessages = (db, conversationId) => db.messages.filter((m) => m.conversationId === conversationId);
export const getConversation = (db, requestId) => db.conversations.find((c) => c.requestId === requestId) ?? null;

/** Everything about one coaching relationship, in one object. */
export function describeCoaching(db, request, now = Date.now()) {
  const subscription = getSubscription(db, request.id);
  return {
    request,
    phase: requestPhase(db, request, now),
    athlete: getUser(db, request.athleteId),
    trainer: getUser(db, request.trainerId),
    program: getCustomProgram(db, request.id),
    subscription,
    subscriptionState: subscriptionState(subscription, now),
  };
}

const newestFirst = (a, b) => new Date(b.request.createdAt) - new Date(a.request.createdAt);

/** The athlete's programs area: coaching relationships plus purchased and free general programs. */
export function getAthleteLibrary(db, athleteId, now = Date.now()) {
  const coaching = db.requests.filter((r) => r.athleteId === athleteId).map((r) => describeCoaching(db, r, now)).sort(newestFirst);
  const byPhase = (...phases) => coaching.filter((c) => phases.includes(c.phase));

  const purchasedIds = new Set(
    db.payments
      .filter((p) => p.kind === PAYMENT_KIND.GENERAL && p.athleteId === athleteId && p.status === PAYMENT_STATUS.CONFIRMED)
      .map((p) => p.targetId),
  );
  const programsByIds = (ids) => db.programs.filter((p) => ids.has(p.id));

  return {
    active: byPhase(PHASE.ACTIVE),
    awaitingPayment: byPhase(PHASE.AWAITING_PAYMENT),
    pending: byPhase(PHASE.PENDING, PHASE.PREPARING),
    expired: byPhase(PHASE.EXPIRED),
    closed: byPhase(PHASE.REJECTED, PHASE.CANCELLED),
    purchased: programsByIds(purchasedIds),
    free: programsByIds(new Set(db.freeLibrary.filter((e) => e.athleteId === athleteId).map((e) => e.programId))),
  };
}

/** Trainer buckets. A general-program buyer never appears here unless they also requested coaching. */
export function getTrainerClients(db, trainerId, now = Date.now()) {
  const all = db.requests.filter((r) => r.trainerId === trainerId).map((r) => describeCoaching(db, r, now)).sort(newestFirst);
  const byPhase = (...phases) => all.filter((c) => phases.includes(c.phase));
  const soon = now + 7 * DAY_MS;
  return {
    pending: byPhase(PHASE.PENDING),
    accepted: byPhase(PHASE.PREPARING),
    awaitingPayment: byPhase(PHASE.AWAITING_PAYMENT),
    active: byPhase(PHASE.ACTIVE),
    expired: byPhase(PHASE.EXPIRED),
    // Renewal opportunities: expired, or active and ending within a week.
    renewals: all.filter((c) => c.phase === PHASE.EXPIRED || (c.phase === PHASE.ACTIVE && c.subscription.endAt <= soon)),
  };
}

/** Workout activity the trainer reviews for one custom program. */
export function getClientProgress(db, customProgram) {
  const sessions = db.sessions.filter((s) => s.programId === customProgram.id && s.status === 'completed');
  const planned = Math.max(1, customProgram.daysPerWeek * customProgram.durationWeeks);
  return {
    sessions,
    planned,
    percent: Math.min(100, Math.round((sessions.length / planned) * 100)),
    lastActivity: sessions[0]?.date ?? null,
  };
}

/** Whole days left in an active subscription (0 when not active). */
export const daysLeft = (subscription, now = Date.now()) =>
  subscriptionState(subscription, now) === 'active' ? Math.max(0, Math.ceil((subscription.endAt - now) / DAY_MS)) : 0;
