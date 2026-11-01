// Views, likes and reviews. Views and likes feed the trainer's statistics; reviews are only possible for
// people who actually used the service (a program they have, or a coaching subscription that was paid).
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS, PROGRAM_STATUS } from '../constants.js';
import { getSubscription } from '../access.js';
import { uid } from '../format.js';
import { byId, fail, nowIso, ok, replaceById, withNotification } from './shared.js';

export const REVIEW_TARGETS = { PROGRAM: 'program', COACHING: 'coaching' };

/** Who owns the thing being viewed / reviewed (the trainer who gets the statistics). */
function trainerOf(db, targetKind, targetId) {
  if (targetKind === 'trainer') return byId(db.users, targetId)?.id ?? null;
  if (targetKind === REVIEW_TARGETS.PROGRAM) return byId(db.programs, targetId)?.ownerId ?? null;
  if (targetKind === REVIEW_TARGETS.COACHING) return byId(db.requests, targetId)?.trainerId ?? null;
  return null;
}

/**
 * Counts a view. Only athletes count (a trainer looking at their own page is not a visit) and the same
 * athlete is counted once per day per target. Anything else is ignored silently (not an error).
 */
export function recordView(db, userId, targetKind, targetId, now = Date.now()) {
  const viewer = byId(db.users, userId);
  const trainerId = trainerOf(db, targetKind, targetId);
  if (viewer?.role !== 'athlete' || !trainerId) return ok(db);
  const recent = db.events.some((e) => e.userId === userId && e.targetKind === targetKind && e.targetId === targetId && now - new Date(e.at) < DAY_MS);
  if (recent) return ok(db);
  const event = { id: uid(), type: 'view', targetKind, targetId, trainerId, userId, at: nowIso(now) };
  return ok({ ...db, events: [event, ...db.events] });
}

/** Like / unlike a published general program. */
export function toggleLike(db, userId, programId, now = Date.now()) {
  const program = byId(db.programs, programId);
  if (byId(db.users, userId)?.role !== 'athlete') return fail('forbidden');
  if (!program || program.status !== PROGRAM_STATUS.PUBLISHED) return fail('not_found');
  const existing = db.likes.find((l) => l.athleteId === userId && l.programId === programId);
  if (existing) return ok({ ...db, likes: db.likes.filter((l) => l.id !== existing.id) }, { liked: false });
  const like = { id: uid(), athleteId: userId, programId, trainerId: program.ownerId, at: nowIso(now) };
  return ok({ ...db, likes: [like, ...db.likes] }, { liked: true });
}

/** Has the athlete really used this program? Paid: confirmed purchase. Free: saved it or trained with it. */
export function hasUsedProgram(db, userId, program) {
  if (program.price > 0) {
    return db.payments.some((p) => p.kind === PAYMENT_KIND.GENERAL && p.targetId === program.id && p.athleteId === userId && p.status === PAYMENT_STATUS.PAID);
  }
  return db.freeLibrary.some((e) => e.athleteId === userId && e.programId === program.id) || db.sessions.some((s) => s.userId === userId && s.programId === program.id);
}

/** null when allowed, otherwise the reason code. */
export function reviewBlocker(db, userId, targetKind, targetId) {
  if (byId(db.users, userId)?.role !== 'athlete') return 'forbidden';
  if (targetKind === REVIEW_TARGETS.PROGRAM) {
    const program = byId(db.programs, targetId);
    if (!program || program.ownerId === userId) return 'not_found';
    return hasUsedProgram(db, userId, program) ? null : 'review_not_allowed';
  }
  if (targetKind === REVIEW_TARGETS.COACHING) {
    const request = byId(db.requests, targetId);
    if (!request || request.athleteId !== userId) return 'forbidden';
    return getSubscription(db, request.id)?.paymentIds.length ? null : 'review_not_allowed'; // coaching must have been paid at least once
  }
  return 'not_found';
}

/** Rating 1-5 with an optional comment; one review per athlete per target (sending again edits it). */
export function submitReview(db, userId, { targetKind, targetId, rating, text = '' }, now = Date.now()) {
  const blocker = reviewBlocker(db, userId, targetKind, targetId);
  if (blocker) return fail(blocker);
  const errors = {};
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) errors.rating = 'required';
  if (text.length > 600) errors.text = 'too_long';
  if (Object.keys(errors).length) return fail('validation', errors);

  const trainerId = trainerOf(db, targetKind, targetId);
  const existing = db.reviews.find((r) => r.athleteId === userId && r.targetKind === targetKind && r.targetId === targetId);
  const review = { ...(existing ?? {}), id: existing?.id ?? uid(), athleteId: userId, trainerId, targetKind, targetId, rating: Number(rating), text: text.trim(), createdAt: existing?.createdAt ?? nowIso(now), updatedAt: nowIso(now) };
  const reviews = existing ? replaceById(db.reviews, review) : [review, ...db.reviews];
  const next = existing ? { ...db, reviews } : withNotification({ ...db, reviews }, trainerId, 'review_new', { athlete: byId(db.users, userId).name, rating: String(review.rating) }, { kind: 'page', page: 'insights' }, now);
  return ok(next, { review });
}
