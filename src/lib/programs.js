// Pure helpers for programs: cloning, sessions and per-exercise targets.
/** Keep session items in sync with the selected exercises; new ones go to the first session. */
export function buildSessions(sessions = [], exerciseIds = []) {
  const kept = sessions.map((s) => ({ ...s, items: s.items.filter((id) => exerciseIds.includes(id)) }));
  const result = kept.length ? kept : [{ name: 'روز ۱ · Day 1', items: [] }];
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

/** «12 reps» / «30 s» / «weights & reps»; `t` is the translate function. */
export function describeTarget(exercise, target, t) {
  if (exercise.type === 'weight') return t('player.weightAndReps');
  return `${target.reps} ${t(exercise.type === 'duration' ? 'common.seconds' : 'common.reps')}`;
}

/** The next workout day: rotates through the program's sessions by how many workouts were already finished. */
export function nextSession(program, finishedCount) {
  const sessions = program.sessions ?? [];
  return sessions[finishedCount % Math.max(1, sessions.length)] ?? null;
}
