// Derived data about workouts and the exercise bank, computed from the stored state.
import { kcalForSet } from './calories.js';
import { MILESTONES } from './constants.js';
import { formatDate, locale } from './format.js';

export const getCompletedSessions = (db, userId) =>
  db.sessions.filter((s) => s.userId === userId && s.status === 'completed');

/** Notifications addressed to this user. */
export const getNotifications = (db, userId) => db.notifications.filter((n) => n.userId === userId);

export function filterExercises(exercises, query, category) {
  const q = query.trim().toLowerCase();
  return exercises.filter(
    (e) => (!category || e.cat === category) && `${e.fa} ${e.en} ${e.muscle} ${e.cat}`.toLowerCase().includes(q),
  );
}

/** [{ id, name, n, unit, kcal }] sorted by volume, for the "totals" list. `t` translates the unit. */
export function totalsByExercise(sessions, exercises) {
  const totals = {};
  sessions.flatMap((s) => s.sets ?? []).forEach((set) => {
    const exercise = exercises.find((e) => e.id === set.exerciseId);
    if (!exercise) return;
    const entry = (totals[exercise.id] ??= { id: exercise.id, exercise, n: 0, timed: exercise.type === 'duration', kcal: 0 });
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
      label: day.toLocaleDateString(locale(), { weekday: 'narrow' }),
      count: sessions.filter((s) => new Date(s.date).toDateString() === day.toDateString()).length,
    };
  });
}

export const shortDate = (iso) => formatDate(iso, { month: 'long', day: 'numeric' });

/** Exercise name in the active language (Persian / English). */
export const exerciseName = (exercise, lang) => (lang === 'fa' ? exercise.fa : exercise.en);
