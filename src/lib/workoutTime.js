// Workout clock. Time spent paused (or sitting on the finish screen) is not training time, and once the
// last set is logged the clock stops, so the total shown at the end no longer ticks.

/** Training time in whole seconds. `now` only matters while the workout is running. */
export function activeSeconds(workout, now = Date.now()) {
  if (!workout) return 0;
  const end = workout.finishedAt ?? workout.pausedAt ?? now;
  return Math.max(0, Math.floor((end - workout.startedAt - (workout.pausedMs ?? 0)) / 1000));
}

/** Changes that pause the clock (idempotent: pausing twice keeps the first pause moment). */
export const pausePatch = (workout, at = Date.now()) => ({ state: 'paused', pausedAt: workout.pausedAt ?? at });

/** Changes that resume the clock and bank the time spent paused. */
export const resumePatch = (workout, at = Date.now()) => ({
  state: 'active',
  pausedMs: (workout.pausedMs ?? 0) + (workout.pausedAt ? at - workout.pausedAt : 0),
  pausedAt: null,
});

/** Changes for the moment the last set is logged: the clock stops. */
export const finishPatch = (at = Date.now()) => ({ state: 'ready-to-finish', finishedAt: at });

/** Going back from the finish screen: the time spent there is not counted. */
export const reopenPatch = (workout, at = Date.now()) => ({
  state: 'active',
  pausedMs: (workout.pausedMs ?? 0) + (workout.finishedAt ? at - workout.finishedAt : 0),
  finishedAt: null,
});
