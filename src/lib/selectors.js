// Derived data: lookups, filters and statistics computed from the stored state.
import { kcalForSet } from './calories';
import { ACTIVE, MILESTONES } from './constants';
import { formatDate } from './format';

export const getAthletesOf = (db, coachId) =>
  db.users.filter((u) => u.role === 'athlete' && u.coachId === coachId);

export const getActiveAssignment = (db, userId) =>
  db.assignments.find((a) => a.userId === userId && a.status === ACTIVE);

export const getProgram = (db, id) => db.programs.find((p) => p.id === id) ?? null;

export const getCompletedSessions = (db, userId) =>
  db.sessions.filter((s) => s.userId === userId && s.status === 'completed');

export const getVisiblePrograms = (db, user) =>
  user.role === 'coach'
    ? db.programs.filter((p) => p.owner === user.id && !p.assignedTo)
    : db.programs.filter((p) => p.assignedTo === user.id);

export const getTemplates = (db, coachId) =>
  db.programs.filter((p) => p.owner === coachId && !p.assignedTo);

export const getNotifications = (db, userId) =>
  db.notifications.filter((n) => !n.userId || n.userId === userId);

export function filterExercises(exercises, query, category) {
  const q = query.trim().toLowerCase();
  return exercises.filter(
    (e) =>
      (category === 'همه' || e.cat === category) &&
      `${e.fa} ${e.en} ${e.muscle} ${e.cat}`.toLowerCase().includes(q),
  );
}

const countsAsReps = (exercise) => exercise && exercise.type !== 'duration';

/** Total repetitions (timed exercises are excluded because their "reps" are seconds). */
export function sumReps(sessions, exercises) {
  return sessions
    .flatMap((s) => s.sets ?? [])
    .reduce((total, set) => {
      const exercise = exercises.find((e) => e.id === set.exerciseId);
      return countsAsReps(exercise) ? total + (Number(set.reps) || 0) : total;
    }, 0);
}

/** [{ name, n, unit, kcal }] sorted by volume, for the "totals" list. */
export function totalsByExercise(sessions, exercises) {
  const totals = {};
  sessions.flatMap((s) => s.sets ?? []).forEach((set) => {
    const exercise = exercises.find((e) => e.id === set.exerciseId);
    if (!exercise) return;
    const entry = (totals[exercise.fa] ??= { name: exercise.fa, n: 0, unit: exercise.type === 'duration' ? 'ثانیه' : 'تکرار', kcal: 0 });
    entry.n += Number(set.reps) || 0;
    entry.kcal += kcalForSet(exercise, set);
  });
  return Object.values(totals).sort((a, b) => b.n - a.n);
}

export const nextMilestone = (n) => MILESTONES.find((m) => n < m) ?? n;

export const countActiveDays = (sessions) => new Set(sessions.map((s) => new Date(s.date).toDateString())).size;

/** Last seven days, oldest first: [{ label, count }]. */
export function lastSevenDays(sessions) {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - i));
    return {
      label: day.toLocaleDateString('fa-IR', { weekday: 'narrow' }),
      count: sessions.filter((s) => new Date(s.date).toDateString() === day.toDateString()).length,
    };
  });
}

/** How far an athlete is through their active program. */
export function progressOf(db, athlete) {
  const assignment = getActiveAssignment(db, athlete.id);
  const program = assignment ? getProgram(db, assignment.programId) : null;
  const all = getCompletedSessions(db, athlete.id);
  const done = assignment ? all.filter((s) => s.date.slice(0, 10) >= assignment.startDate) : all;
  const planned = Math.max(1, (program?.days || 3) * (program?.weeks || 4));
  return {
    assignment,
    program,
    all,
    done,
    planned,
    percent: program ? Math.min(100, Math.round((done.length / planned) * 100)) : 0,
  };
}

export const shortDate = (iso) => formatDate(iso, { month: 'long', day: 'numeric' });
