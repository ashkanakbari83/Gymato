import { useApp } from '../../context/AppContext';
import { calcBmi } from '../../lib/body';
import { faDecimal, faNum } from '../../lib/format';
import { progressOf } from '../../lib/selectors';
import ProgressBar from '../ui/ProgressBar';

/** One athlete in a coach's list: name, current program, BMI and program progress. Opens the detail sheet. */
export default function AthleteRow({ athlete }) {
  const { db, openModal } = useApp();
  const { program, percent } = progressOf(db, athlete);
  const bmi = calcBmi(athlete.height, athlete.weight);

  return (
    <button className="row" onClick={() => openModal({ type: 'athlete-detail', athlete })}>
      <span className="avatar">{athlete.name[0]}</span>
      <span className="row-main">
        <b>{athlete.name}</b>
        <small>
          {program ? program.name : 'بدون برنامه فعال'}
          {bmi && ` · BMI ${faDecimal(bmi)}`}
        </small>
      </span>
      <span className="row-end">
        {faNum(percent)}٪
        <ProgressBar value={percent} />
      </span>
    </button>
  );
}
