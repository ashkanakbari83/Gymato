// Admin panel numbers and settings. Pure functions over the saved state. Only people with `isAdmin` may read the panel
// or change settings (the checks live here, not only in the screen).
//
// Money: "volume" is what athletes paid trainers (coaching, renewals, programs); "premium revenue" is what trainers
// paid the platform for the Featured subscription. The platform's cut of the volume (`settings.commissionRate`) is an
// ESTIMATE for planning; nothing in the app charges it yet.
import { DAY_MS, DEFAULT_SETTINGS, PAYMENT_KIND, PAYMENT_STATUS, PREMIUM, REQUEST_STATUS, SUBSCRIPTION_STATUS } from './constants.js';
import { subscriptionState } from './access.js';
import { PROVINCES } from '../data/locations.js';
import { athleteCount, isPremium, premiumDaysLeft, slotLimit, trainerScore } from './premium.js';
import { getIncome, ratingOf, getTrainerReviews } from './analytics.js';
import { fail, ok } from './domain/shared.js';

export const SETTING_LIMITS = { premiumSlots: { min: 1, max: 50 }, commissionRate: { min: 0, max: 50 } };

export const isAdmin = (user) => Boolean(user?.isAdmin);
const paid = (db) => db.payments.filter((p) => p.status === PAYMENT_STATUS.PAID);
const sum = (list) => list.reduce((total, p) => total + p.amount, 0);
const commissionRate = (db) => {
  const rate = Number(db.settings?.commissionRate);
  return Number.isFinite(rate) ? rate : DEFAULT_SETTINGS.commissionRate;
};

/** Headline numbers for the whole platform. */
export function platformStats(db, now = Date.now()) {
  const trainers = db.users.filter((u) => u.role === 'coach');
  const athletes = db.users.filter((u) => u.role === 'athlete');
  const payments = paid(db);
  const trainerPayments = payments.filter((p) => p.kind !== PAYMENT_KIND.PREMIUM);
  const premiumPayments = payments.filter((p) => p.kind === PAYMENT_KIND.PREMIUM);
  const recent = (list) => list.filter((p) => now - new Date(p.paidAt) < 30 * DAY_MS);
  const featured = trainers.filter((u) => isPremium(u, now));
  const rate = commissionRate(db);
  const reviews = ratingOf(db.reviews);
  return {
    users: db.users.length,
    trainers: trainers.length,
    athletes: athletes.length,
    accounts: db.users.filter((u) => u.passwordHash).length,
    coachingTrainers: trainers.filter((u) => u.offersCoaching).length,
    featured: featured.length,
    mrr: featured.length * PREMIUM.price,
    premiumRevenue: sum(premiumPayments),
    premiumLast30: sum(recent(premiumPayments)),
    volume: sum(trainerPayments),
    volumeLast30: sum(recent(trainerPayments)),
    commissionRate: rate,
    commission: Math.round((sum(trainerPayments) * rate) / 100),
    commissionLast30: Math.round((sum(recent(trainerPayments)) * rate) / 100),
    activeSubscriptions: db.subscriptions.filter((s) => subscriptionState(s, now) === SUBSCRIPTION_STATUS.ACTIVE).length,
    pendingRequests: db.requests.filter((r) => r.status === REQUEST_STATUS.PENDING).length,
    programs: db.programs.length,
    reviews: reviews.count,
    avgRating: reviews.avg,
    paymentsCount: payments.length,
  };
}

/** One row per province: trainers, featured places used / available, and the best featured trainer's name. */
export function provinceTable(db, now = Date.now()) {
  const total = slotLimit(db);
  return PROVINCES.map((province) => {
    const trainers = db.users.filter((u) => u.role === 'coach' && u.province === province.id);
    const featured = trainers.filter((u) => isPremium(u, now));
    return {
      id: province.id,
      trainers: trainers.length,
      athletes: db.users.filter((u) => u.role === 'athlete' && u.province === province.id).length,
      used: featured.length,
      total,
      full: featured.length >= total,
    };
  }).sort((a, b) => b.trainers - a.trainers || a.id.localeCompare(b.id));
}

/** The sorts the "top trainers" list offers. */
export const TRAINER_SORTS = ['score', 'athletes', 'income', 'rating'];

/** Trainers ranked by one measure: [{ trainer, score, athletes, income, avg, count, featured }]. */
export function topTrainers(db, { by = 'score', limit = 8 } = {}, now = Date.now()) {
  const rows = db.users.filter((u) => u.role === 'coach').map((trainer) => {
    const { avg, count } = ratingOf(getTrainerReviews(db, trainer.id));
    return {
      trainer,
      score: trainerScore(db, trainer.id).score,
      athletes: athleteCount(db, trainer.id),
      income: getIncome(db, trainer.id, now).total,
      avg,
      count,
      featured: isPremium(trainer, now),
    };
  });
  const key = TRAINER_SORTS.includes(by) ? by : 'score';
  return rows.sort((a, b) => b[key] - a[key] || b.score - a.score || a.trainer.name.localeCompare(b.trainer.name, 'fa')).slice(0, limit);
}

/** Everyone with an active Featured subscription, the ones ending soonest first. */
export function premiumRoster(db, now = Date.now()) {
  return db.users
    .filter((u) => u.role === 'coach' && isPremium(u, now))
    .map((trainer) => ({ trainer, daysLeft: premiumDaysLeft(trainer, now), score: trainerScore(db, trainer.id).score }))
    .sort((a, b) => a.daysLeft - b.daysLeft || b.score - a.score);
}

/** Last paid orders, newest first, with who paid and who got it. */
export function recentPayments(db, limit = 8) {
  return paid(db)
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
    .slice(0, limit)
    .map((payment) => ({
      payment,
      payer: db.users.find((u) => u.id === payment.athleteId) ?? null,
      payee: payment.trainerId ? db.users.find((u) => u.id === payment.trainerId) ?? null : null,
    }));
}

/** Money per 30-day window, oldest first: [{ start, volume, premium }] (the last window ends now). */
export function monthlyRevenue(db, now = Date.now(), months = 6) {
  const payments = paid(db);
  return Array.from({ length: months }, (_, i) => {
    const end = now - (months - 1 - i) * 30 * DAY_MS;
    const start = end - 30 * DAY_MS;
    const inWindow = payments.filter((p) => new Date(p.paidAt) > start && new Date(p.paidAt) <= end);
    return {
      start: new Date(start).toISOString(),
      volume: sum(inWindow.filter((p) => p.kind !== PAYMENT_KIND.PREMIUM)),
      premium: sum(inWindow.filter((p) => p.kind === PAYMENT_KIND.PREMIUM)),
    };
  });
}

/**
 * Changes platform settings. Only an admin may; each value is a whole number inside SETTING_LIMITS.
 * Lowering `premiumSlots` below what a province already uses never removes anyone: it only stops new subscriptions there.
 */
export function updateSettings(db, adminId, patch) {
  if (!isAdmin(db.users.find((u) => u.id === adminId))) return fail('forbidden');
  const fields = {};
  const clean = {};
  for (const key of Object.keys(SETTING_LIMITS)) {
    if (!(key in patch)) continue;
    const value = Number(patch[key]);
    const { min, max } = SETTING_LIMITS[key];
    if (!Number.isInteger(value) || value < min || value > max) fields[key] = 'invalid';
    else clean[key] = value;
  }
  if (Object.keys(fields).length) return fail('validation', fields);
  return ok({ ...db, settings: { ...DEFAULT_SETTINGS, ...(db.settings ?? {}), ...clean } });
}
