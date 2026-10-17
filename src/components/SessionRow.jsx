import { useApp } from '../context/AppContext';
import { estimateCalories } from '../lib/calories';
import { faNum } from '../lib/format';
import { shortDate } from '../lib/selectors';

/** A finished workout: name, date, sets, estimated calories and duration. */
export default function SessionRow({ session }) {
  const { db } = useApp();
  const calories = estimateCalories(session.sets, db.exercises);

  return (
    <div className="row">
      <span className="row-main">
        <b>{session.name}</b>
        <small>
          {shortDate(session.date)} · {faNum(session.sets?.length ?? 0)} ست · ≈ {faNum(calories)} کالری
        </small>
      </span>
      <span className="row-end">{faNum(Math.round((session.duration || 0) / 60))} دقیقه</span>
    </div>
  );
}
