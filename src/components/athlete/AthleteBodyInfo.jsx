import { calcBmi, bmiCategory } from '../../lib/body';
import { faDecimal, faNum } from '../../lib/format';

/** Height / weight / BMI strip a coach sees when working with an athlete. */
export default function AthleteBodyInfo({ athlete }) {
  const bmi = calcBmi(athlete.height, athlete.weight);
  const category = bmi && bmiCategory(bmi);

  return (
    <div className="body-info">
      <div>
        <small>قد</small>
        <b>{athlete.height ? <>{faNum(athlete.height)} <i>cm</i></> : '—'}</b>
      </div>
      <div>
        <small>وزن</small>
        <b>{athlete.weight ? <>{faNum(athlete.weight)} <i>kg</i></> : '—'}</b>
      </div>
      <div>
        <small>BMI</small>
        <b>{bmi ? faDecimal(bmi) : '—'}</b>
        {category && <span className={`bmi-tag ${category.tone}`}>{category.label}</span>}
      </div>
    </div>
  );
}
