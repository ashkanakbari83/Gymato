import { Check, Pause, Play, Target } from 'lucide-react';
import { Field } from '../components/ui/Field';
import { faNum, formatClock } from '../lib/format';
import { describeTarget } from '../lib/programs';

/**
 * Logs one set. Compact on purpose (the whole player must fit a phone screen):
 * reps / weight inputs, or a countdown for timed holds.
 */
export default function SetCard({ exercise, target, setNumber, inputs, onInput, countdown, now, onToggleCountdown, onComplete }) {
  const isTimed = exercise.type === 'duration';
  const remaining = countdown ? Math.max(0, countdown.seconds - Math.floor((now - countdown.start) / 1000)) : null;
  const shownSeconds = remaining ?? (Number(inputs.duration) || target.reps);
  const placeholder = String(target.reps);

  return (
    <div className="player-set-card">
      <div className="set-row">
        <div className="set-count">
          <small>ست</small>
          <b>{faNum(Math.min(setNumber, target.sets))}</b>
          <span>/ {faNum(target.sets)}</span>
        </div>
        <div className="target-pill">
          <Target size={15} />
          {describeTarget(exercise, { reps: faNum(target.reps) })}
        </div>
      </div>

      {isTimed && (
        <div className="set-timer">
          <b>{formatClock(shownSeconds)}</b>
          <button className="btn ghost" onClick={onToggleCountdown}>
            {countdown ? <Pause size={16} /> : <Play size={16} />}
            {countdown ? 'توقف' : 'شروع تایمر'}
          </button>
        </div>
      )}

      {exercise.type === 'reps' && (
        <Field label="تکرار واقعی" type="number" min="0" value={inputs.reps} placeholder={placeholder} onChange={onInput('reps')} />
      )}

      {exercise.type === 'weight' && (
        <div className="log-fields">
          <Field label="تکرار واقعی" type="number" min="0" value={inputs.reps} placeholder={placeholder} onChange={onInput('reps')} />
          <Field label="وزنه (kg)" type="number" min="0" value={inputs.weight} placeholder="۰" onChange={onInput('weight')} />
        </div>
      )}

      <button className="btn wide complete-set" onClick={onComplete}>
        <Check size={18} /> ثبت ست و ادامه
      </button>
    </div>
  );
}
