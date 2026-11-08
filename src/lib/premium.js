// Premium trainers and ranking. Pure functions over the saved state.
//
// Who is shown first: trainers with an active premium subscription form the featured group; inside each group the order
// is the trainer's SCORE, never the payment itself. The score only uses what athletes did: likes on programs, reviews
// (their ratings and how many people wrote one) and how many athletes the trainer actually worked with or sold to.
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS, PREMIUM } from './constants.js';
import { getTrainerReviews, ratingOf } from './analytics.js';
import { hasAccount } from './auth.js';

/** How much each part counts toward the 0-100 score, and where it stops growing. */
export const SCORE_PARTS = [
  { id: 'rating', weight: 30 }, // average rating, pulled toward the middle while there are few reviews
  { id: 'reviews', weight: 20, cap: 15 }, // number of reviews (comments)
  { id: 'likes', weight: 25, cap: 30 }, // likes on the trainer's programs
  { id: 'athletes', weight: 25, cap: 25 }, // different athletes they coached or sold a program to
];
/** The benefits listed on the Premium page (texts premium.<id>); only things the app really does. */
export const PREMIUM_BENEFITS = ['b1', 'b2', 'b3', 'b4'];
const PRIOR_RATING = 3.5; // what a trainer with no reviews is assumed to be
const PRIOR_WEIGHT = 3; // ...worth this many reviews

export const isPremium = (user, now = Date.now()) => user?.role === 'coach' && Boolean(user.premium?.until) && new Date(user.premium.until).getTime() > now;
export const premiumDaysLeft = (user, now = Date.now()) => (isPremium(user, now) ? Math.ceil((new Date(user.premium.until).getTime() - now) / DAY_MS) : 0);

/**
 * Distinct athletes who asked this trainer for coaching or paid for one of their programs. Sample trainers (no account)
 * also carry a fixed `sampleAthletes` number standing in for their history, so the list looks lived-in without fake orders.
 */
export function athleteCount(db, trainerId) {
  const ids = new Set(db.requests.filter((r) => r.trainerId === trainerId).map((r) => r.athleteId));
  db.payments.filter((p) => p.trainerId === trainerId && p.status === PAYMENT_STATUS.PAID).forEach((p) => ids.add(p.athleteId));
  const sample = db.users.find((u) => u.id === trainerId)?.sampleAthletes ?? 0;
  return ids.size + sample;
}

const share = (value, cap) => Math.min(value, cap) / cap;

/** { score (0-100, one decimal), parts: [{ id, weight, value (raw number), points }] } */
export function trainerScore(db, trainerId) {
  const reviews = getTrainerReviews(db, trainerId);
  const { avg, count } = ratingOf(reviews);
  const smoothed = (avg * count + PRIOR_RATING * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT);
  const likes = db.likes.filter((l) => l.trainerId === trainerId).length;
  const athletes = athleteCount(db, trainerId);
  const raw = { rating: smoothed, reviews: count, likes, athletes };
  const fraction = { rating: smoothed / 5, reviews: share(count, 15), likes: share(likes, 30), athletes: share(athletes, 25) };
  const parts = SCORE_PARTS.map(({ id, weight }) => ({ id, weight, value: id === 'rating' ? Number(smoothed.toFixed(1)) : raw[id], points: Number((fraction[id] * weight).toFixed(1)) }));
  return { score: Number(parts.reduce((sum, part) => sum + part.points, 0).toFixed(1)), parts };
}

/**
 * Orders trainers for the list: featured (active premium) first, then everyone else; inside each group by score, then
 * by name so the order never jumps between visits.
 */
export function rankTrainers(db, trainers, now = Date.now()) {
  return trainers
    .map((trainer) => ({ trainer, premium: isPremium(trainer, now), score: trainerScore(db, trainer.id).score }))
    .sort((a, b) => Number(b.premium) - Number(a.premium) || b.score - a.score || a.trainer.name.localeCompare(b.trainer.name, 'fa'))
    .map((row) => row.trainer);
}

/** Active premium trainers of one province. */
export const premiumInProvince = (db, province, now = Date.now()) => (province ? db.users.filter((u) => u.province === province && isPremium(u, now)) : []);

/**
 * Time-based premium events that need a notification, found when the app opens (and now and then while it stays open):
 * a heads-up in the last days, and a note when the subscription ended. Each is sent once per subscription (flags live
 * on `user.premium`; a renewal writes a new object, so the flags start over). Returns a state patch, or null when
 * nothing changed.
 */
export function reconcilePremium(db, now = Date.now()) {
  let notifications = db.notifications;
  let changed = false;
  const users = db.users.map((user) => {
    if (user.role !== 'coach' || !user.premium?.until || !hasAccount(user)) return user; // sample trainers have no account to notify
    const left = premiumDaysLeft(user, now);
    const flags = {};
    if (left > 0 && left <= PREMIUM.renewWindowDays && !user.premium.notifiedSoon) {
      flags.notifiedSoon = true;
      notifications = [makeNote(user.id, 'premium_expiring', { n: left }, now), ...notifications];
    }
    if (!isPremium(user, now) && !user.premium.notifiedEnded) {
      flags.notifiedEnded = true;
      notifications = [makeNote(user.id, 'premium_expired', {}, now), ...notifications];
    }
    if (!Object.keys(flags).length) return user;
    changed = true;
    return { ...user, premium: { ...user.premium, ...flags } };
  });
  return changed ? { users, notifications } : null;
}

const makeNote = (userId, type, params, now) => ({
  id: `n-${type}-${userId}-${now}`, userId, type, params, target: { kind: 'page', page: 'premium' }, read: false, createdAt: new Date(now).toISOString(),
});

/**
 * Where a trainer stands in their province: `rank` among all trainers there today, and `featuredRank`: the place they
 * would (or do) have inside the featured group, from the score.
 */
export function provinceStanding(db, trainer, now = Date.now()) {
  const peers = db.users.filter((u) => u.role === 'coach' && u.province && u.province === trainer.province);
  const ordered = rankTrainers(db, peers, now);
  const mine = trainerScore(db, trainer.id).score;
  const featured = premiumInProvince(db, trainer.province, now).filter((u) => u.id !== trainer.id);
  const featuredRank = featured.filter((u) => trainerScore(db, u.id).score > mine).length + 1;
  return { rank: ordered.findIndex((u) => u.id === trainer.id) + 1, total: peers.length, featuredRank, featuredCount: featured.length + 1 };
}

/** Can this trainer start (or extend) a premium subscription now? `ok` or a reason. */
export function canGoPremium(db, trainer, now = Date.now()) {
  if (trainer?.role !== 'coach') return { ok: false, reason: 'not_trainer' };
  if (!trainer.province) return { ok: false, reason: 'no_province' };
  const active = isPremium(trainer, now);
  if (active && premiumDaysLeft(trainer, now) > PREMIUM.renewWindowDays) return { ok: false, reason: 'already_active' };
  return { ok: true };
}

export const isPremiumOrder = (payment) => payment?.kind === PAYMENT_KIND.PREMIUM;
