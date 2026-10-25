import { Timer } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatClock, num } from '../lib/format.js';

/** Replaces the set card while resting between sets. */
export default function RestBanner({ secondsLeft, nextSet, totalSets, onSkip, onExtend }) {
  const { t } = useApp();
  return (
    <div className="rest-banner">
      <Timer size={22} />
      <div>
        <b>
          {t('player.rest', { n: num(nextSet), total: num(totalSets) })}
        </b>
        <strong>{formatClock(secondsLeft)}</strong>
      </div>
      <button onClick={onSkip}>{t('player.skip')}</button>
      <button onClick={onExtend}>{t('player.plus15', { n: num(15) })}</button>
    </div>
  );
}
