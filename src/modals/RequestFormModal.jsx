// "Request Custom Coaching": prefilled from the athlete's profile, editable, with an optional full-body photo.
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';
import { ChipSelect, Field, RadioCards, SelectField, TextArea } from '../components/ui/Field.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { GOALS, LEVELS, MUSCLES } from '../lib/constants.js';
import { fileToDataUrl } from '../lib/images.js';
import { validateRequestForm } from '../lib/domain/coaching.js';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function RequestFormModal({ trainerId }) {
  const { user, db, t, requestCoaching } = useApp();
  const trainer = db.users.find((u) => u.id === trainerId);
  const fileInput = useRef(null);
  const [form, setForm] = useState({
    name: user.name,
    age: user.age ?? '',
    height: user.height ?? '',
    weight: user.weight ?? '',
    goal: user.goal ?? GOALS[0],
    level: user.level ?? LEVELS[0],
    muscles: [],
    daysPerWeek: 3,
    schedule: '',
    notes: '',
    photo: '',
    wantsMealPlan: null, // must be answered: the trainer needs to know whether to prepare a meal plan
  });
  const [errors, setErrors] = useState({});
  const [attempted, setAttempted] = useState(false);
  const summaryRef = useRef(null);
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e)); // an error goes away as soon as the field is touched
  };
  const error = (key) => (errors[key] ? t(`field.${errors[key]}`) : undefined);

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      set('photo')(await fileToDataUrl(file, 1080)); // large enough to look at closely in the viewer
      setErrors((e) => ({ ...e, photo: undefined }));
    } catch {
      setErrors((e) => ({ ...e, photo: 'invalid' }));
    }
  };

  const submit = () => {
    const found = validateRequestForm(form);
    setErrors(found);
    setAttempted(true);
    if (!Object.keys(found).length) requestCoaching(trainerId, form);
    else requestAnimationFrame(() => summaryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  };

  const FIELD_LABELS = { name: 'cr.name', age: 'cr.age', height: 'cr.heightOptional', weight: 'cr.weightOptional', level: 'cr.level', goal: 'cr.goal', daysPerWeek: 'cr.daysPerWeek', schedule: 'cr.schedule', notes: 'cr.notes', photo: 'cr.photoOptional', wantsMealPlan: 'cr.mealQuestion' };
  const problems = Object.keys(errors).filter((key) => errors[key]).map((key) => ({ name: key, label: `${t(FIELD_LABELS[key] ?? 'field.invalid')}: ${t(`field.${errors[key]}`)}` }));

  const options = (ids, prefix) => ids.map((id) => ({ value: id, label: t(`${prefix}.${id}`) }));

  return (
    <Sheet title={t('cr.title', { name: trainer.name })}>
      <p className="muted">{t('cr.intro')}</p>
      {attempted && <ErrorSummary items={problems} containerRef={summaryRef} />}
      <Field name="name" label={t('cr.name')} value={form.name} onChange={set('name')} error={error('name')} />
      <div className="form-grid">
        <Field name="age" label={t('cr.ageOptional')} type="number" value={form.age} onChange={set('age')} error={error('age')} />
        <Field name="height" label={t('cr.heightOptional')} type="number" value={form.height} onChange={set('height')} error={error('height')} />
        <Field name="weight" label={t('cr.weightOptional')} type="number" value={form.weight} onChange={set('weight')} error={error('weight')} />
        <SelectField name="level" label={t('cr.level')} value={form.level} onChange={set('level')} options={options(LEVELS, 'level')} error={error('level')} />
      </div>
      <SelectField name="goal" label={t('cr.goal')} value={form.goal} onChange={set('goal')} options={options(GOALS, 'goal')} error={error('goal')} />
      <ChipSelect multi label={t('cr.musclesOptional')} options={options(MUSCLES, 'focus')} value={form.muscles} onChange={set('muscles')} />
      <div className="form-grid">
        <SelectField name="daysPerWeek" label={t('cr.daysPerWeek')} value={form.daysPerWeek} onChange={set('daysPerWeek')} options={DAYS.map((d) => ({ value: d, label: String(d) }))} error={error('daysPerWeek')} />
        <Field name="schedule" label={t('cr.scheduleOptional')} value={form.schedule} onChange={set('schedule')} error={error('schedule')} />
      </div>
      <TextArea name="notes" label={t('cr.notesOptional')} value={form.notes} onChange={set('notes')} error={error('notes')} />

      <RadioCards
        name="wantsMealPlan"
        label={t('cr.mealQuestion')}
        value={form.wantsMealPlan}
        onChange={set('wantsMealPlan')}
        error={error('wantsMealPlan')}
        options={[
          { value: true, label: t('cr.mealYes') },
          { value: false, label: t('cr.mealNo') },
        ]}
      />

      <div className="field" data-field="photo">
        <span>{t('cr.photoOptional')}</span>
        {form.photo ? (
          <div className="photo-preview">
            <img src={form.photo} alt={t('cr.photoAlt')} />
            <button className="btn ghost" onClick={() => set('photo')('')}><Trash2 size={15} /> {t('common.remove')}</button>
          </div>
        ) : (
          <button className="btn ghost" type="button" onClick={() => fileInput.current?.click()}><Camera size={16} /> {t('cr.addPhoto')}</button>
        )}
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={pickPhoto} />
        {error('photo') && <small className="field-error">{error('photo')}</small>}
        <small className="field-hint">{t('cr.photoHint')}</small>
      </div>

      <button className="btn wide" onClick={submit}>{t('cr.submit')}</button>
    </Sheet>
  );
}
