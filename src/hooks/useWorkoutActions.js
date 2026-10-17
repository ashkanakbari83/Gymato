// Starting, finishing and leaving a workout.
import { DEFAULT_FREE_WORKOUT } from '../lib/constants';
import { uid } from '../lib/format';

/** Starting, finishing and leaving a workout. */
export function useWorkoutActions({ user, update, notify, workout, setWorkout, setPage }) {
  const startWorkout = (program = null, session = program?.sessions?.[0]) => {
    setWorkout({
      id: uid(),
      userId: user.id,
      programId: program?.id,
      targets: program?.targets ?? {},
      name: session?.name ?? program?.name ?? 'تمرین آزاد',
      exerciseIds: session?.items ?? program?.exercises ?? DEFAULT_FREE_WORKOUT,
      index: 0,
      setIndex: 0,
      logs: [],
      state: 'active',
      startedAt: Date.now(),
      restUntil: null,
    });
    setPage('player');
    notify('تمرین شروع شد؛ موفق باشی!');
  };

  const finishWorkout = () => {
    if (!workout) return;
    const session = {
      id: workout.id,
      userId: workout.userId,
      name: workout.name,
      date: new Date().toISOString(),
      status: 'completed',
      duration: Math.max(0, Math.round((Date.now() - workout.startedAt) / 1000)),
      sets: workout.logs.filter((log) => log.status === 'completed'),
      exerciseIds: workout.exerciseIds,
    };
    update((d) => ({ sessions: [session, ...d.sessions.filter((s) => s.id !== session.id)], activeWorkout: null }));
    setWorkout(null);
    setPage('progress');
    notify('تمرین ذخیره شد؛ آفرین!');
  };

  const exitWorkout = () => {
    if (!confirm('تمرین در حال اجرا ذخیره شود و خارج شوی؟')) return;
    update({ activeWorkout: workout });
    setPage('home');
  };

  return { startWorkout, finishWorkout, exitWorkout };
}
