// What the athlete submitted. Trainers also see BMI.
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import AthleteBodyInfo from '../athlete/AthleteBodyInfo.jsx';
import Badge from '../ui/Badge.jsx';
import ViewableImage from '../ui/ViewableImage.jsx';

export default function RequestSummary({ request, showBody }) {
  const { t } = useApp();
  const { form } = request;
  const rows = [
    ['cr.goal', t(`goal.${form.goal}`)],
    ['cr.level', t(`level.${form.level}`)],
    ['cr.daysPerWeek', num(form.daysPerWeek)],
    form.age !== '' && ['cr.age', num(form.age)],
    typeof form.wantsMealPlan === 'boolean' && ['cr.mealWanted', t(form.wantsMealPlan ? 'cr.mealWantedYes' : 'cr.mealWantedNo')],
    form.schedule && ['cr.schedule', form.schedule],
    form.notes && ['cr.notes', form.notes],
  ].filter(Boolean);

  return (
    <section className="co-section">
      <h3>{t('co.requestDetails')}</h3>
      {showBody && <AthleteBodyInfo source={form} />}
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{t(label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {form.muscles.length > 0 && (
        <div className="listing-tags">
          {form.muscles.map((m) => (
            <Badge key={m}>{t(`focus.${m}`)}</Badge>
          ))}
        </div>
      )}
      {form.photo && <ViewableImage className="request-photo-btn" imgClassName="request-photo" images={[{ src: form.photo, alt: t('cr.photoAltOf', { name: form.name }) }]} />}
    </section>
  );
}
