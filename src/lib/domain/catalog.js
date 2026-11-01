// General programs: trainers publish them; athletes get them free or after a confirmed purchase.
// A general program never creates a coaching relationship.
import { PROGRAM_KIND, PROGRAM_STATUS } from '../constants.js';
import { hasGeneralAccess, isFreeProgram } from '../access.js';
import { uid } from '../format.js';
import { sanitizeMealPlan } from '../mealPlan.js';
import { buildSessions } from '../programs.js';
import { canTransition } from '../transitions.js';
import { byId, fail, nowIso, ok, replaceById } from './shared.js';

/** Field errors for a general program draft; `publish` adds the fields required for a public listing. */
export function validateGeneralProgram(draft, { publish = false } = {}) {
  const errors = {};
  if (!draft.title?.trim()) errors.title = 'required';
  const price = Number(draft.price);
  if (!Number.isInteger(price) || price < 0) errors.price = 'invalid';
  if (!draft.exercises?.length) errors.exercises = 'required';
  const days = Number(draft.daysPerWeek);
  if (!(days >= 1 && days <= 7)) errors.daysPerWeek = 'invalid';
  const weeks = Number(draft.durationWeeks);
  if (!(weeks >= 1 && weeks <= 52)) errors.durationWeeks = 'invalid';
  if (publish && !draft.description?.trim()) errors.description = 'required';
  return errors;
}

/** Create or update a general program owned by `trainerId`. `status` is the requested publication status. */
export function saveGeneralProgram(db, trainerId, draft, status = PROGRAM_STATUS.DRAFT, now = Date.now()) {
  if (byId(db.users, trainerId)?.role !== 'coach') return fail('forbidden');
  const existing = draft.id ? byId(db.programs, draft.id) : null;
  if (existing && existing.ownerId !== trainerId) return fail('forbidden'); // trainers edit only their own programs

  const errors = validateGeneralProgram(draft, { publish: status === PROGRAM_STATUS.PUBLISHED });
  if (Object.keys(errors).length) return fail('validation', errors);

  const exercises = [...draft.exercises];
  const program = {
    ...(existing ?? {}),
    id: existing?.id ?? uid(),
    kind: PROGRAM_KIND.GENERAL,
    ownerId: trainerId,
    title: draft.title.trim(),
    description: (draft.description ?? '').trim(),
    goals: [...(draft.goals ?? [])],
    level: draft.level,
    durationWeeks: Number(draft.durationWeeks),
    daysPerWeek: Number(draft.daysPerWeek),
    price: Number(draft.price),
    notes: (draft.notes ?? '').trim(),
    safety: (draft.safety ?? '').trim(),
    mealPlan: sanitizeMealPlan(draft.mealPlan),
    exercises,
    targets: { ...(draft.targets ?? {}) },
    sessions: buildSessions(draft.sessions ?? existing?.sessions, exercises),
    status,
    createdAt: existing?.createdAt ?? nowIso(now),
    updatedAt: nowIso(now),
  };
  const programs = existing ? replaceById(db.programs, program) : [program, ...db.programs];
  return ok({ ...db, programs }, { program });
}

/** Publish / unpublish. Publishing re-validates the program. Existing buyers keep their access. */
export function setProgramStatus(db, trainerId, programId, status, now = Date.now()) {
  const program = byId(db.programs, programId);
  if (!program || program.ownerId !== trainerId) return fail('forbidden');
  if (!canTransition('program', program.status, status)) return fail('invalid_transition');
  return saveGeneralProgram(db, trainerId, program, status, now);
}

/** Programs people already use (purchases or saved free copies) cannot be deleted; unpublish them instead. */
export function deleteGeneralProgram(db, trainerId, programId) {
  const program = byId(db.programs, programId);
  if (!program || program.ownerId !== trainerId) return fail('forbidden');
  const inUse =
    db.payments.some((p) => p.targetId === programId && p.status === 'paid') ||
    db.freeLibrary.some((entry) => entry.programId === programId);
  if (inUse) return fail('has_customers');
  return ok({ ...db, programs: db.programs.filter((p) => p.id !== programId) });
}

/** Add a free, published program to the athlete's library. No payment, no coaching. */
export function claimFreeProgram(db, athleteId, programId, now = Date.now()) {
  const athlete = byId(db.users, athleteId);
  const program = byId(db.programs, programId);
  if (athlete?.role !== 'athlete') return fail('forbidden');
  if (!program || program.status !== PROGRAM_STATUS.PUBLISHED) return fail('not_found');
  if (!isFreeProgram(program)) return fail('payment_required');
  if (!hasGeneralAccess(db, athleteId, program)) return fail('forbidden');
  if (db.freeLibrary.some((e) => e.athleteId === athleteId && e.programId === programId)) return ok(db);
  const entry = { id: uid(), athleteId, programId, addedAt: nowIso(now) };
  return ok({ ...db, freeLibrary: [entry, ...db.freeLibrary] });
}
