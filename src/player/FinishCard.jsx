import { Check, Trophy } from 'lucide-react';
import { faNum, formatClock } from '../lib/format';

/** Shown after the last set: quick recap with estimated calories, then save. */
export default function FinishCard({ setsCount, calories, elapsed, onSave, onBack }) {
  const stats = [
    { value: faNum(setsCount), label: 'ست ثبت‌شده' },
    { value: formatClock(elapsed), label: 'زمان تمرین' },
    { value: `≈ ${faNum(calories)}`, label: 'کالری سوزانده' },
  ];

  return (
    <div className="finish-card">
      <span className="finish-icon">
        <Trophy size={36} />
      </span>
      <h1>تمرینت تمام شد!</h1>
      <p>عالی بود. ثبت‌های امروز آماده ذخیره هستند.</p>
      <div className="finish-stats">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <b>{value}</b>
            <small>{label}</small>
          </div>
        ))}
      </div>
      <button className="btn wide" onClick={onSave}>
        <Check size={18} /> ذخیره تمرین و مشاهده گزارش
      </button>
      <button className="link" onClick={onBack}>
        بازگشت به تمرین
      </button>
    </div>
  );
}
