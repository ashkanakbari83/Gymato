// Rough calorie estimates. Each exercise carries an average (kcalPerRep for rep-based
// moves, kcalPerMin for timed ones); results are approximations, not measurements.
import { faDecimal, faNum } from './format';

/** Calories for one logged set ({ exerciseId, reps }) of the given exercise. */
export function kcalForSet(exercise, set) {
  if (!exercise) return 0;
  const amount = Number(set.reps) || 0;
  return exercise.type === 'duration'
    ? (amount / 60) * (exercise.kcalPerMin ?? 0) // for timed moves "reps" are seconds
    : amount * (exercise.kcalPerRep ?? 0);
}

/** Total estimated calories (rounded) for a list of logged sets. */
export const estimateCalories = (sets = [], exercises) =>
  Math.round(sets.reduce((sum, set) => sum + kcalForSet(exercises.find((e) => e.id === set.exerciseId), set), 0));

/** Total estimated calories across whole sessions. */
export const sessionsCalories = (sessions, exercises) =>
  estimateCalories(sessions.flatMap((s) => s.sets ?? []), exercises);

/** Short label for the exercise detail: «≈ ۴٫۵ کالری به ازای ۱۰ تکرار». */
export function describeCalories(exercise) {
  if (exercise.kcalPerMin) return `≈ ${faDecimal(exercise.kcalPerMin)} کالری در دقیقه`;
  if (exercise.kcalPerRep) return `≈ ${faDecimal(exercise.kcalPerRep * 10)} کالری به ازای ${faNum(10)} تکرار`;
  return null;
}
