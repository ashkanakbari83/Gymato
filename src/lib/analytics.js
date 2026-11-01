// Statistics and income for a trainer, computed from events, likes, reviews and confirmed payments.
// Income is gross (what athletes paid); there is no platform fee in this prototype.
import { subscriptionState } from './access.js';
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS, SUBSCRIPTION_STATUS } from './constants.js';

const confirmed = (db, trainerId) =>
  db.payments.filter((p) => p.trainerId === trainerId && p.status === PAYMENT_STATUS.PAID).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

/** { avg, count } for a list of reviews (avg is 0 when there are none). */
export function ratingOf(reviews) {
  if (!reviews.length) return { avg: 0, count: 0 };
  return { avg: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length, count: reviews.length };
}

export const getTrainerReviews = (db, trainerId) => db.reviews.filter((r) => r.trainerId === trainerId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
export const getProgramReviews = (db, programId) => db.reviews.filter((r) => r.targetKind === 'program' && r.targetId === programId).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
export const getCoachingReviews = (db, requestId) => db.reviews.filter((r) => r.targetKind === 'coaching' && r.targetId === requestId);

export const hasLiked = (db, userId, programId) => db.likes.some((l) => l.athleteId === userId && l.programId === programId);
export const likeCount = (db, programId) => db.likes.filter((l) => l.programId === programId).length;

/** Everything shown for one general program. */
export function getProgramStats(db, programId) {
  const views = db.events.filter((e) => e.targetKind === 'program' && e.targetId === programId);
  const sales = confirmedPurchases(db, programId);
  return {
    views: views.length,
    likes: likeCount(db, programId),
    ...ratingOf(getProgramReviews(db, programId)),
    sales: sales.length,
    revenue: sales.reduce((sum, p) => sum + p.amount, 0),
  };
}

const confirmedPurchases = (db, programId) =>
  db.payments.filter((p) => p.kind === PAYMENT_KIND.GENERAL && p.targetId === programId && p.status === PAYMENT_STATUS.PAID);

/** Engagement across all of a trainer's profile and programs. */
export function getTrainerStats(db, trainerId) {
  const events = db.events.filter((e) => e.trainerId === trainerId);
  return {
    profileViews: events.filter((e) => e.targetKind === 'trainer').length,
    programViews: events.filter((e) => e.targetKind === 'program').length,
    likes: db.likes.filter((l) => l.trainerId === trainerId).length,
    ...ratingOf(getTrainerReviews(db, trainerId)),
  };
}

/** Income split by source, plus the last 30 days. */
export function getIncome(db, trainerId, now = Date.now()) {
  const payments = confirmed(db, trainerId);
  const sum = (list) => list.reduce((total, p) => total + p.amount, 0);
  const kind = (k) => payments.filter((p) => p.kind === k);
  return {
    total: sum(payments),
    last30: sum(payments.filter((p) => now - new Date(p.paidAt) < 30 * DAY_MS)),
    general: sum(kind(PAYMENT_KIND.GENERAL)),
    coaching: sum(kind(PAYMENT_KIND.COACHING)),
    renewals: sum(kind(PAYMENT_KIND.RENEWAL)),
    count: payments.length,
    payments,
  };
}

/** Income per 7-day window, oldest first: [{ start, amount }] (the last window ends now). */
export function getIncomeByWeek(db, trainerId, now = Date.now(), weeks = 6) {
  const payments = confirmed(db, trainerId);
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    const amount = payments.filter((p) => new Date(p.paidAt) > start && new Date(p.paidAt) <= end).reduce((sum, p) => sum + p.amount, 0);
    return { start: new Date(start).toISOString(), amount };
  });
}

/**
 * Real student numbers for a trainer, from paid coaching subscriptions: `active` = people whose subscription is running
 * now, `total` = people who ever paid for coaching (active or expired). Each person counts once, however often they renewed.
 */
export function getStudentStats(db, trainerId, now = Date.now()) {
  const mine = db.subscriptions.filter((s) => s.trainerId === trainerId);
  const withState = mine.map((s) => ({ athleteId: s.athleteId, state: subscriptionState(s, now) }));
  const distinct = (states) => new Set(withState.filter((s) => states.includes(s.state)).map((s) => s.athleteId)).size;
  return { active: distinct([SUBSCRIPTION_STATUS.ACTIVE]), total: distinct([SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.EXPIRED]) };
}
