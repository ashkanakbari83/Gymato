// Starting, finishing and leaving a workout.
import { canStartProgram } from '../lib/access.js';
import { DEFAULT_FREE_WORKOUT } from '../lib/constants.js';
import { unlockAudio } from '../lib/feedback.js';
import { uid } from '../lib/format.js';
import { activeSeconds } from '../lib/workoutTime.js';

/** Starting, finishing and leaving a workout. */
export function useWorkoutActions({ db, user, update, notify, t, workout, setWorkout, setPage }) {
  /**
   * Starts a workout. A program is only started when the access rules allow it (free, purchased, or an
   * active coaching subscription); with no program it is a free workout.
   */
  const startWorkout = (program = null, session = program?.sessions?.[0]) => {
    if (program && !canStartProgram(db, user, program)) return notify(t('error.locked'), 'alert');
    unlockAudio();
    setWorkout({
      id: uid(),
      userId: user.id,
      programId: program?.id ?? null,
      programKind: program?.kind ?? null,
      targets: program?.targets ?? {},
      name: session?.name ?? program?.title ?? t('player.freeWorkout'),
      exerciseIds: session?.items ?? program?.exercises ?? DEFAULT_FREE_WORKOUT,
      index: 0,
      setIndex: 0,
      logs: [],
      state: 'active',
      startedAt: Date.now(),
      pausedMs: 0, // total time spent paused; not training time
      pausedAt: null,
      finishedAt: null,
      restUntil: null,
    });
    setPage('player');
    notify(t('player.started'));
  };

  const finishWorkout = () => {
    if (!workout) return;
    const session = {
      id: workout.id,
      userId: workout.userId,
      programId: workout.programId,
      programKind: workout.programKind,
      name: workout.name,
      date: new Date().toISOString(),
      status: 'completed',
      duration: activeSeconds(workout),
      sets: workout.logs.filter((log) => log.status === 'completed'),
      exerciseIds: workout.exerciseIds,
    };
    update((d) => ({ sessions: [session, ...d.sessions.filter((s) => s.id !== session.id)], activeWorkout: null }));
    setWorkout(null);
    setPage('progress');
    notify(t('player.saved'));
  };

  const exitWorkout = () => {
    if (!confirm(t('player.confirmExit'))) return;
    update({ activeWorkout: workout });
    setPage('home');
  };

  return { startWorkout, finishWorkout, exitWorkout };
}
