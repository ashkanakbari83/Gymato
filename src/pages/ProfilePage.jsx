// Profile. Athletes edit body info (used to prefill coaching requests); trainers edit the public profile
// that athletes see in discovery (location, specialties, bio, whether they offer custom coaching).
import { Copy, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ChipSelect, Field, SelectField, TextArea } from '../components/ui/Field.jsx';
import LocationFields from '../components/ui/LocationFields.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FOCUS_AREAS, GOALS, LEVELS } from '../lib/constants.js';

const toForm = (user) => ({
  name: user.name,
  province: user.province ?? '',
  city: user.city ?? '',
  age: user.age ?? '',
  height: user.height ?? '',
  weight: user.weight ?? '',
  goal: user.goal ?? GOALS[0],
  level: user.level ?? LEVELS[0],
  specialties: user.specialties ?? [],
  bio: user.bio ?? '',
  experienceYears: user.experienceYears ?? 0,
  offersCoaching: user.offersCoaching ?? false,
});

export default function ProfilePage() {
  const { user, isTrainer, updateProfile, t } = useApp();
  const [form, setForm] = useState(() => toForm(user));
  const [copied, setCopied] = useState(false);
  useEffect(() => setForm(toForm(user)), [user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const copyId = () => {
    navigator.clipboard?.writeText(user.publicId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const save = () => {
    const num = (v) => (v === '' ? '' : Number(v));
    updateProfile(
      isTrainer
        ? { name: form.name.trim() || user.name, province: form.province, city: form.city, specialties: form.specialties, bio: form.bio.trim(), experienceYears: num(form.experienceYears) || 0, offersCoaching: form.offersCoaching }
        : { name: form.name.trim() || user.name, province: form.province, city: form.city, age: num(form.age), height: num(form.height), weight: num(form.weight), goal: form.goal, level: form.level },
    );
  };

  return (
    <div className="stack narrow">
      <section className="panel">
        <div className="id-row">
          <div>
            <small className="muted">{t('profile.publicId')}</small>
            <b className="pid">{user.publicId}</b>
          </div>
          <button className="btn ghost" onClick={copyId}><Copy size={16} /> {copied ? t('common.copied') : t('common.copy')}</button>
        </div>
      </section>

      <section className="panel">
        <Field label={t('cr.name')} value={form.name} onChange={set('name')} />
        <div className="form-grid">
          <LocationFields province={form.province} city={form.city} emptyLabel={t('common.notSet')} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
        </div>

        {isTrainer ? (
          <>
            <ChipSelect multi label={t('profile.specialties')} options={FOCUS_AREAS.map((id) => ({ value: id, label: t(`focus.${id}`) }))} value={form.specialties} onChange={set('specialties')} />
            <TextArea label={t('profile.bio')} value={form.bio} onChange={set('bio')} />
            <Field label={t('profile.experience')} type="number" min="0" value={form.experienceYears} onChange={set('experienceYears')} />
            <label className="check-row">
              <input type="checkbox" checked={form.offersCoaching} onChange={(e) => set('offersCoaching')(e.target.checked)} />
              {t('profile.offersCoaching')}
            </label>
          </>
        ) : (
          <>
            <div className="form-grid">
              <Field label={t('cr.age')} type="number" value={form.age} onChange={set('age')} />
              <SelectField label={t('cr.level')} value={form.level} onChange={set('level')} options={LEVELS.map((id) => ({ value: id, label: t(`level.${id}`) }))} />
              <Field label={t('body.heightCm')} type="number" value={form.height} onChange={set('height')} />
              <Field label={t('body.weightKg')} type="number" value={form.weight} onChange={set('weight')} />
            </div>
            <SelectField label={t('cr.goal')} value={form.goal} onChange={set('goal')} options={GOALS.map((id) => ({ value: id, label: t(`goal.${id}`) }))} />
            <p className="muted">{t('profile.prefillNote')}</p>
          </>
        )}
        <button className="btn wide" onClick={save}><Save size={17} /> {t('common.save')}</button>
      </section>
    </div>
  );
}
