// Statistics and income for a trainer, computed from events, likes, reviews and confirmed payments.
// Income is gross (what athletes paid); there is no platform fee in this prototype.
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS } from './constants.js';

const confirmed = (db, trainerId) =>
  db.payments.filter((p) => p.trainerId === trainerId && p.status === PAYMENT_STATUS.CONFIRMED).sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt));

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
  db.payments.filter((p) => p.kind === PAYMENT_KIND.GENERAL && p.targetId === programId && p.status === PAYMENT_STATUS.CONFIRMED);

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
    last30: sum(payments.filter((p) => now - new Date(p.confirmedAt) < 30 * DAY_MS)),
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
    const amount = payments.filter((p) => new Date(p.confirmedAt) > start && new Date(p.confirmedAt) <= end).reduce((sum, p) => sum + p.amount, 0);
    return { start: new Date(start).toISOString(), amount };
  });
}
