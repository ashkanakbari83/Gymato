import { Check, Pause, Play, Target } from 'lucide-react';
import { Field } from '../components/ui/Field.jsx';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, num } from '../lib/format.js';
import { describeTarget } from '../lib/programs.js';

/**
 * Logs one set. Compact on purpose (the whole player must fit a phone screen):
 * reps / weight inputs, or a countdown for timed holds.
 */
export default function SetCard({ exercise, target, setNumber, inputs, onInput, countdown, now, onToggleCountdown, onComplete }) {
  const { t } = useApp();
  const isTimed = exercise.type === 'duration';
  const remaining = countdown ? Math.max(0, countdown.seconds - Math.floor((now - countdown.start) / 1000)) : null;
  const shownSeconds = remaining ?? (Number(inputs.duration) || target.reps);
  const placeholder = String(target.reps);

  return (
    <div className="player-set-card">
      <div className="set-row">
        <div className="set-count">
          <small>{t('player.set')}</small>
          <b>{num(Math.min(setNumber, target.sets))}</b>
          <span>/ {num(target.sets)}</span>
        </div>
        <div className="target-pill">
          <Target size={15} />
          {describeTarget(exercise, { reps: num(target.reps) }, t)}
        </div>
      </div>

      {isTimed && (
        <div className="set-timer">
          <b>{formatClock(shownSeconds)}</b>
          <button className="btn ghost" onClick={onToggleCountdown}>
            {countdown ? <Pause size={16} /> : <Play size={16} />}
            {countdown ? t('player.stop') : t('player.startTimer')}
          </button>
        </div>
      )}

      {exercise.type === 'reps' && (
        <Field label={t('player.actualReps')} type="number" min="0" value={inputs.reps} placeholder={placeholder} onChange={onInput('reps')} />
      )}

      {exercise.type === 'weight' && (
        <div className="log-fields">
          <Field label={t('player.actualReps')} type="number" min="0" value={inputs.reps} placeholder={placeholder} onChange={onInput('reps')} />
          <Field label={t('player.weightKg')} type="number" min="0" value={inputs.weight} placeholder={num(0)} onChange={onInput('weight')} />
        </div>
      )}

      <button className="btn wide complete-set" onClick={onComplete}>
        <Check size={18} /> {t('player.logSet')}
      </button>
    </div>
  );
}
