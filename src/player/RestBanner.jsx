import { Timer } from 'lucide-react';
import { faNum, formatClock } from '../lib/format';

/** Replaces the set card while resting between sets. */
export default function RestBanner({ secondsLeft, nextSet, totalSets, onSkip, onExtend }) {
  return (
    <div className="rest-banner">
      <Timer size={22} />
      <div>
        <b>
          استراحت · ست {faNum(nextSet)} از {faNum(totalSets)}
        </b>
        <strong>{formatClock(secondsLeft)}</strong>
      </div>
      <button onClick={onSkip}>رد کردن</button>
      <button onClick={onExtend}>+۱۵ ثانیه</button>
    </div>
  );
}
