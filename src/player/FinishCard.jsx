import { Check, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatDuration, num } from '../lib/format.js';

/** Shown after the last set: quick recap with estimated calories, then save. */
export default function FinishCard({ setsCount, calories, elapsed, onSave, onBack }) {
  const { t } = useApp();
  const stats = [
    { value: num(setsCount), label: t('player.setsLogged') },
    { value: formatDuration(elapsed, t), label: t('player.time') },
    { value: `≈ ${num(calories)}`, label: t('stat.kcal') },
  ];

  return (
    <div className="finish-card">
      <span className="finish-icon">
        <Trophy size={36} />
      </span>
      <h1>{t('player.doneTitle')}</h1>
      <p>{t('player.doneText')}</p>
      <div className="finish-stats">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <button className="btn wide" onClick={onSave}>
        <Check size={18} /> {t('player.saveReport')}
      </button>
      <button className="link" onClick={onBack}>
        {t('player.backToWorkout')}
      </button>
    </div>
  );
}
