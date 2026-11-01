// The trainer's own profile form: photo, banner, basics, specialties, bio, resume and album.
// Nothing is saved until "Save"; it is checked first, errors sit next to the fields and in a list at the top.
import { Save } from 'lucide-react';
import { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useBusy } from '../../hooks/useBusy.js';
import { FOCUS_AREAS } from '../../lib/constants.js';
import { IMAGE_SIZES, PROFILE_LIMITS, sanitizeTrainerProfile, validateTrainerProfile } from '../../lib/domain/trainerProfile.js';
import Avatar from '../ui/Avatar.jsx';
import ErrorSummary from '../ui/ErrorSummary.jsx';
import { ChipSelect, Field, TextArea } from '../ui/Field.jsx';
import ImageField from '../ui/ImageField.jsx';
import LocationFields from '../ui/LocationFields.jsx';
import Spinner from '../ui/Spinner.jsx';
import AlbumEditor from './AlbumEditor.jsx';
import ResumeEditor from './ResumeEditor.jsx';

const toForm = (user) => ({
  name: user.name,
  province: user.province ?? '',
  city: user.city ?? '',
  specialties: user.specialties ?? [],
  bio: user.bio ?? '',
  experienceYears: user.experienceYears ?? 0,
  offersCoaching: user.offersCoaching ?? false,
  avatar: user.avatar ?? '',
  banner: user.banner ?? '',
  resume: (user.resume ?? []).map((row) => ({ ...row })),
  album: (user.album ?? []).map((item) => ({ ...item })),
});

const LABELS = { name: 'cr.name', bio: 'profile.bio', experienceYears: 'profile.experience', specialties: 'profile.specialties', avatar: 'profile.avatar', banner: 'profile.banner', resume: 'resume.title', album: 'album.title' };

export default function TrainerProfileEditor() {
  const { user, saveTrainerProfile, t } = useApp();
  const [form, setForm] = useState(() => toForm(user));
  const [attempts, setAttempts] = useState(0);
  const [saved, setSaved] = useState(null); // domain-level error (e.g. storage full)
  const { busy, run } = useBusy();
  const summaryRef = useRef(null);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  // Errors are recomputed from the form after a failed attempt, so fixing a field clears its message at once.
  const errors = attempts ? validateTrainerProfile(sanitizeTrainerProfile(form)) : {};
  const error = (key) => (errors[key] ? t(`field.${errors[key]}`) : undefined);
  const items = Object.keys(errors).map((key) => {
    const [group, id, part] = key.split('.');
    let label = t(LABELS[group] ?? 'field.invalid');
    if (group === 'resume' && id) label = `${t('resume.title')}: ${form.resume.find((r) => r.id === id)?.title || t('resume.untitled')} — ${t(`resume.field.${part}`)}`;
    if (group === 'album' && id) label = `${t('album.title')} #${form.album.findIndex((i) => i.id === id) + 1}`;
    return { name: key, label: `${label}: ${t(`field.${errors[key]}`)}` };
  });

  const submit = () =>
    run('save', () => {
      const result = saveTrainerProfile(form);
      setSaved(result.ok ? null : result.error);
      if (!result.ok && result.error === 'validation') {
        setAttempts((n) => n + 1);
        requestAnimationFrame(() => summaryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      } else if (result.ok) {
        setAttempts(0);
        setForm(toForm(result.trainer));
      }
    });

  return (
    <>
      {attempts > 0 && <ErrorSummary items={items} title={t('profile.fixThese')} containerRef={summaryRef} />}
      {saved === 'storage_full' && <p className="field-error" role="alert">{t('profile.storageFull')}</p>}

      <section className="panel form-stack">
        <ImageField name="banner" label={t('profile.banner')} value={form.banner} onChange={set('banner')} maxSide={IMAGE_SIZES.banner} shape="wide" alt={t('profile.bannerAlt')} hint={t('profile.bannerHint')} error={errors.banner} addLabel="img.addBanner" />
        <ImageField name="avatar" label={t('profile.avatar')} value={form.avatar} onChange={set('avatar')} maxSide={IMAGE_SIZES.avatar} shape="round" alt={t('profile.avatarAlt')} hint={t('profile.avatarHint')} error={errors.avatar} fallback={<Avatar user={{ ...user, name: form.name || user.name, avatar: '' }} size="xl" />} />
      </section>

      <section className="panel form-stack">
        <Field name="name" label={t('cr.name')} value={form.name} maxLength={PROFILE_LIMITS.name} onChange={set('name')} error={error('name')} />
        <div className="form-grid">
          <LocationFields province={form.province} city={form.city} emptyLabel={t('common.notSet')} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
        </div>
        <ChipSelect multi name="specialties" label={t('profile.specialties')} options={FOCUS_AREAS.map((id) => ({ value: id, label: t(`focus.${id}`) }))} value={form.specialties} onChange={set('specialties')} error={error('specialties')} />
        <TextArea name="bio" label={t('profile.bio')} rows={5} maxLength={PROFILE_LIMITS.bio + 50} value={form.bio} onChange={set('bio')} error={error('bio')} hint={t('profile.bioCount', { n: form.bio.length, max: PROFILE_LIMITS.bio })} />
        <Field name="experienceYears" label={t('profile.experience')} type="number" min="0" max={PROFILE_LIMITS.experience} value={form.experienceYears} onChange={set('experienceYears')} error={error('experienceYears')} />
        <label className="check-row">
          <input type="checkbox" checked={form.offersCoaching} onChange={(e) => set('offersCoaching')(e.target.checked)} />
          {t('profile.offersCoaching')}
        </label>
      </section>

      <section className="panel form-stack"><ResumeEditor value={form.resume} onChange={set('resume')} errors={errors} /></section>
      <section className="panel form-stack"><AlbumEditor value={form.album} onChange={set('album')} errors={errors} /></section>

      <button className="btn wide" disabled={busy !== null} aria-busy={busy === 'save'} onClick={submit}>
        {busy === 'save' ? <Spinner /> : <Save size={17} />} {t(busy === 'save' ? 'editor.saving' : 'common.save')}
      </button>
    </>
  );
}
