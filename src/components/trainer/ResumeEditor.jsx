// Trainer's resume: work history, certificates and awards, as a list of small cards.
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { uid } from '../../lib/format.js';
import { PROFILE_LIMITS, RESUME_KINDS } from '../../lib/domain/trainerProfile.js';
import { Field, SelectField, TextArea } from '../ui/Field.jsx';

export default function ResumeEditor({ value, onChange, errors = {} }) {
  const { t } = useApp();
  const err = (id, key) => (errors[`resume.${id}.${key}`] ? t(`field.${errors[`resume.${id}.${key}`]}`) : undefined);
  const setRow = (id, patch) => onChange(value.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const add = () => onChange([...value, { id: uid(), kind: 'work', title: '', place: '', year: '', text: '' }]);

  return (
    <section className="co-section" aria-labelledby="resume-title">
      <h3 id="resume-title">{t('resume.title')}</h3>
      <p className="muted">{t('resume.help')}</p>
      {value.length === 0 && <p className="muted empty-line">{t('resume.empty')}</p>}
      {value.map((row, index) => (
        <div key={row.id} className="meal-card resume-row" role="group" aria-label={t('resume.item', { n: index + 1 })}>
          <div className="meal-card-top">
            <SelectField label={t('resume.kind')} value={row.kind} onChange={(kind) => setRow(row.id, { kind })} options={RESUME_KINDS.map((kind) => ({ value: kind, label: t(`resume.kind.${kind}`) }))} />
            <button type="button" className="icon-btn" onClick={() => onChange(value.filter((r) => r.id !== row.id))} aria-label={t('resume.remove', { n: index + 1 })}>
              <Trash2 size={17} />
            </button>
          </div>
          <Field name={`resume.${row.id}.title`} label={t(`resume.titleOf.${row.kind}`)} value={row.title} maxLength={PROFILE_LIMITS.resumeTitle} onChange={(title) => setRow(row.id, { title })} error={err(row.id, 'title')} />
          <div className="form-grid">
            <Field name={`resume.${row.id}.place`} label={t(`resume.placeOf.${row.kind}`)} value={row.place} maxLength={PROFILE_LIMITS.resumePlace} onChange={(place) => setRow(row.id, { place })} error={err(row.id, 'place')} />
            <Field name={`resume.${row.id}.year`} label={t('resume.year')} type="number" inputMode="numeric" min="1300" max="2100" value={row.year} onChange={(year) => setRow(row.id, { year })} error={err(row.id, 'year')} />
          </div>
          <TextArea name={`resume.${row.id}.text`} label={t('resume.text')} rows={2} maxLength={PROFILE_LIMITS.resumeText} value={row.text} onChange={(text) => setRow(row.id, { text })} error={err(row.id, 'text')} />
        </div>
      ))}
      {errors.resume && <small className="field-error">{t(`field.${errors.resume}`)}</small>}
      {value.length < PROFILE_LIMITS.resume && (
        <button type="button" className="btn ghost wide" onClick={add}><Plus size={16} /> {t('resume.add')}</button>
      )}
    </section>
  );
}
