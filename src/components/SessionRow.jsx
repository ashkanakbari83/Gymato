// A finished workout: name, date, sets, estimated calories and duration.
import { useApp } from '../context/AppContext.jsx';
import { estimateCalories } from '../lib/calories.js';
import { formatDuration, num } from '../lib/format.js';
import { shortDate } from '../lib/selectors.js';

export default function SessionRow({ session }) {
  const { db, t } = useApp();
  const calories = estimateCalories(session.sets, db.exercises);

  return (
    <div className="row">
      <span className="row-main">
        <b>{session.name}</b>
        <small>{t('session.line', { date: shortDate(session.date), sets: num(session.sets?.length ?? 0), kcal: num(calories) })}</small>
      </span>
      <span className="row-end">{formatDuration(session.duration, t)}</span>
    </div>
  );
}
