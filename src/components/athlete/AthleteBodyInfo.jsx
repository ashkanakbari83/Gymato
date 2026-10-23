// Height / weight / BMI strip a trainer sees when reviewing an athlete.
import { useApp } from '../../context/AppContext.jsx';
import { bmiCategory, calcBmi } from '../../lib/body.js';
import { decimal, num } from '../../lib/format.js';

/** `source` is anything with height and weight (an athlete, or a request form). */
export default function AthleteBodyInfo({ source }) {
  const { t } = useApp();
  const bmi = calcBmi(source.height, source.weight);
  const category = bmi && bmiCategory(bmi);

  return (
    <div className="body-info">
      <div>
        <small>{t('body.height')}</small>
        <b>{source.height ? <>{num(source.height)} <i>cm</i></> : '—'}</b>
      </div>
      <div>
        <small>{t('body.weight')}</small>
        <b>{source.weight ? <>{num(source.weight)} <i>kg</i></> : '—'}</b>
      </div>
      <div>
        <small>BMI</small>
        <b>{bmi ? decimal(bmi) : '—'}</b>
        {category && <span className={`bmi-tag ${category.tone}`}>{t(category.labelKey)}</span>}
      </div>
    </div>
  );
}
