// Pure helpers for programs: cloning, sessions and per-exercise targets.
import { uid } from './format';

/** Deep-enough copy of a program so edits never leak into the original. */
export const cloneProgram = (program, overrides = {}) => ({
  ...program,
  exercises: [...program.exercises],
  targets: { ...(program.targets ?? {}) },
  sessions: (program.sessions ?? []).map((s) => ({ ...s, items: [...s.items] })),
  ...overrides,
});

export const duplicateProgram = (program) =>
  cloneProgram(program, { id: uid(), name: `${program.name} · کپی`, status: 'قالب' });

/** Keep session items in sync with the selected exercises; new ones go to the first session. */
export function buildSessions(sessions = [], exerciseIds = []) {
  const kept = sessions.map((s) => ({ ...s, items: s.items.filter((id) => exerciseIds.includes(id)) }));
  const result = kept.length ? kept : [{ name: 'جلسه اول', items: [] }];
  const used = new Set(result.flatMap((s) => s.items));
  result[0] = { ...result[0], items: [...result[0].items, ...exerciseIds.filter((id) => !used.has(id))] };
  return result;
}

export const defaultTarget = (exercise) => ({ sets: exercise.sets, reps: exercise.reps, rest: exercise.rest });

const numberOr = (value, fallback) => (value === '' || value == null ? fallback : Number(value));

/** Sets / reps / rest for an exercise, honouring the coach's overrides. */
export function resolveTargets(overrides = {}, exercise) {
  const t = overrides[exercise.id] ?? {};
  return {
    sets: Math.max(1, numberOr(t.sets, exercise.sets ?? 3)),
    reps: numberOr(t.reps, exercise.reps),
    rest: numberOr(t.rest, exercise.rest ?? 60),
  };
}

export function describeTarget(exercise, target) {
  if (exercise.type === 'weight') return 'وزنه و تکرار';
  return `${target.reps} ${exercise.type === 'duration' ? 'ثانیه' : 'تکرار'}`;
}
