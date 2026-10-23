// Full-screen workout player. Layout rule: on a phone everything needed (animation, name,
// how-to, set/timer, previous/next) is visible at once, with no scrolling.
import { Clock3, Dumbbell, Pause, Play, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import MoveMedia from '../components/exercise/MoveMedia.jsx';
import Empty from '../components/ui/Empty.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useNow } from '../hooks/useNow.js';
import { estimateCalories } from '../lib/calories.js';
import { formatClock, num, uid } from '../lib/format.js';
import { resolveTargets } from '../lib/programs.js';
import { exerciseName } from '../lib/selectors.js';
import { ArrowBack, ArrowForward } from '../components/ui/Arrow.jsx';
import FinishCard from './FinishCard.jsx';
import HowTo from './HowTo.jsx';
import RestBanner from './RestBanner.jsx';
import SetCard from './SetCard.jsx';

const EMPTY_INPUTS = { reps: '', weight: '', duration: '' };
export default function WorkoutPlayer() {
  const { workout, setWorkout, db, finishWorkout, exitWorkout, lang, t } = useApp();
  const now = useNow();
  const [inputs, setInputs] = useState(EMPTY_INPUTS);
  const [countdown, setCountdown] = useState(null); // { start, seconds } while a timed hold runs

  const patch = useCallback((changes) => setWorkout((w) => (w ? { ...w, ...changes } : w)), [setWorkout]);

  // Rest ends by itself.
  useEffect(() => {
    if (workout?.state === 'resting' && workout.restUntil && now >= workout.restUntil) {
      patch({ state: 'active', restUntil: null });
    }
  }, [now, workout?.state, workout?.restUntil, patch]);

  // A timed hold records its full duration when the countdown reaches zero.
  useEffect(() => {
    if (countdown && now - countdown.start >= countdown.seconds * 1000) {
      setInputs((i) => ({ ...i, duration: String(countdown.seconds) }));
      setCountdown(null);
    }
  }, [now, countdown]);

  // Moving to another set/exercise cancels a running countdown.
  useEffect(() => setCountdown(null), [workout?.index, workout?.setIndex]);

  if (!workout) {
    return (
      <div className="player-screen">
        <Empty icon={Dumbbell} title={t('player.noneTitle')} text={t('player.noneText')} actionLabel={t('common.back')} onAction={exitWorkout} />
      </div>
    );
  }

  const ids = workout.exerciseIds;
  const exercise = db.exercises.find((e) => e.id === ids[workout.index]) ?? db.exercises[0];
  const target = resolveTargets(workout.targets, exercise);
  const setsDone = workout.logs.filter((l) => l.exerciseId === exercise.id).length;
  const progress = Math.min(100, ((workout.index + setsDone / target.sets) / Math.max(1, ids.length)) * 100);
  const elapsed = Math.max(0, Math.floor((now - workout.startedAt) / 1000));
  const restLeft = workout.restUntil ? Math.max(0, Math.ceil((workout.restUntil - now) / 1000)) : 0;
  const isPaused = workout.state === 'paused';
  const isResting = workout.state === 'resting' && restLeft > 0;

  const onInput = (key) => (value) => setInputs((i) => ({ ...i, [key]: value }));

  const goTo = (index) => {
    patch({ index, setIndex: 0, state: 'active', restUntil: null });
    setInputs(EMPTY_INPUTS);
  };

  /** Logs the set, then moves on: rest -> next set, next exercise, or finish. */
  const completeSet = () => {
    const reps = Number((exercise.type === 'duration' ? inputs.duration : inputs.reps) || target.reps);
    const weight = exercise.type === 'weight' ? Number(inputs.weight || 0) : 0;
    const log = { id: uid(), exerciseId: exercise.id, setIndex: workout.setIndex, reps, weight, status: 'completed', completedAt: new Date().toISOString() };
    const logs = [...workout.logs, log];
    setInputs(EMPTY_INPUTS);

    if (workout.setIndex + 1 < target.sets) {
      patch({ logs, setIndex: workout.setIndex + 1, state: 'resting', restUntil: Date.now() + target.rest * 1000 });
    } else if (workout.index + 1 < ids.length) {
      patch({ logs, index: workout.index + 1, setIndex: 0, state: 'active', restUntil: null });
    } else {
      patch({ logs, state: 'ready-to-finish' });
    }
  };

  /** Start the countdown, or stop it and keep the seconds already held. */
  const toggleCountdown = () => {
    if (!countdown) return setCountdown({ start: Date.now(), seconds: target.reps });
    const held = Math.floor((now - countdown.start) / 1000);
    if (held > 0) setInputs((i) => ({ ...i, duration: String(held) }));
    setCountdown(null);
  };

  return (
    <div className="player-screen">
      <header className="player-top">
        <button className="icon-btn" onClick={exitWorkout} aria-label={t('player.exit')}>
          <X />
        </button>
        <div>
          <b>{workout.name}</b>
          <small>{t(`player.state.${workout.state}`)}</small>
        </div>
        <span className="elapsed">
          <Clock3 size={15} />
          {formatClock(elapsed)}
        </span>
      </header>
      <div className="player-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      {workout.state === 'ready-to-finish' ? (
        <FinishCard
          setsCount={workout.logs.length}
          calories={estimateCalories(workout.logs, db.exercises)}
          elapsed={elapsed}
          onSave={finishWorkout}
          onBack={() => patch({ state: 'active' })}
        />
      ) : (
        <div className="player-content">
          <div className="player-visual">
            <MoveMedia exercise={exercise} />
          </div>

          <div className="player-info">
            <div className="player-title-row">
              <h1>{exerciseName(exercise, lang)}</h1>
              <span className="player-count">
                {t('player.counter', { n: num(workout.index + 1), total: num(ids.length) })}
              </span>
            </div>
            <p>{exercise.desc}</p>
            <HowTo title={exerciseName(exercise, lang)} steps={exercise.steps} />
          </div>

          {isResting ? (
            <RestBanner
              secondsLeft={restLeft}
              nextSet={workout.setIndex + 1}
              totalSets={target.sets}
              onSkip={() => patch({ state: 'active', restUntil: null })}
              onExtend={() => patch({ restUntil: workout.restUntil + 15000 })}
            />
          ) : (
            <SetCard
              exercise={exercise}
              target={target}
              setNumber={workout.setIndex + 1}
              inputs={inputs}
              onInput={onInput}
              countdown={countdown}
              now={now}
              onToggleCountdown={toggleCountdown}
              onComplete={completeSet}
            />
          )}

          <div className="player-controls">
            <button className="btn ghost" disabled={workout.index === 0} onClick={() => goTo(workout.index - 1)}>
              <ArrowBack size={17} /> {t('player.prev')}
            </button>
            <button className="pause-btn" onClick={() => patch({ state: isPaused ? 'active' : 'paused' })}>
              {isPaused ? <Play size={17} /> : <Pause size={17} />} {isPaused ? t('player.resume') : t('player.pause')}
            </button>
            <button className="btn ghost" disabled={workout.index >= ids.length - 1} onClick={() => goTo(workout.index + 1)}>
              {t('player.next')} <ArrowForward size={17} />
            </button>
          </div>

          {isPaused && (
            <div className="paused-overlay">
              <span>
                <Pause size={28} />
              </span>
              <h2>{t('player.pausedTitle')}</h2>
              <p>{t('player.pausedText')}</p>
              <button className="btn" onClick={() => patch({ state: 'active' })}>
                <Play size={17} /> {t('player.resumeWorkout')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
