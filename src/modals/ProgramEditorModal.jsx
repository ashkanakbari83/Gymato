// One editor for both program types.
//  - general: a public listing (description, goals, level, price, publication status)
//  - custom : a private program for one athlete, plus the coaching offer (price, renewal price, duration)
// Saving never fails silently: the draft is checked first, every problem is marked next to its field and listed in a
// summary at the top, and the buttons show a spinner (and ignore extra clicks) while the save runs.
import { Utensils } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ExercisePlanner from '../components/exercise/ExercisePlanner.jsx';
import MealPlanEditor from '../components/nutrition/MealPlanEditor.jsx';
import ErrorSummary from '../components/ui/ErrorSummary.jsx';
import { ChipSelect, Field, SelectField, Segmented, TextArea } from '../components/ui/Field.jsx';
import MoneyField from '../components/ui/MoneyField.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useBusy } from '../hooks/useBusy.js';
import { getCustomProgram, getSubscription, subscriptionState } from '../lib/access.js';
import { FOCUS_AREAS, LEVELS, PROGRAM_STATUS } from '../lib/constants.js';
import { CUSTOM_MODE, validateCustomProgram } from '../lib/domain/coaching.js';
import { exerciseName } from '../lib/selectors.js';

const FIELD_ORDER = ['title', 'durationWeeks', 'daysPerWeek', 'price', 'renewalPrice', 'durationDays', 'notes', 'safety', 'exercises'];
const FIELD_LABEL = { title: 'editor.title', durationWeeks: 'editor.weeks', daysPerWeek: 'editor.days', price: 'co.offerPrice', renewalPrice: 'co.offerRenewal', durationDays: 'co.offerDays', notes: 'editor.coachingNotes', safety: 'editor.safety', exercises: 'plan.title' };
const TARGET_LABEL = { sets: 'plan.sets', reps: 'common.reps', rest: 'plan.rest' };

/** Button content: label, or spinner + label while its action runs. */
function Label({ busy, children }) {
  return <>{busy && <Spinner />}{children}</>;
}

export default function ProgramEditorModal({ kind, requestId, editing }) {
  const { db, user, lang, draft, setDraft, saveGeneral, saveCustom, t } = useApp();
  const isCustom = kind === 'custom';
  const { busy, run } = useBusy();
  const summaryRef = useRef(null);
  const [errors, setErrors] = useState({}); // general program: errors reported by the domain, cleared per field on edit
  const [attempt, setAttempt] = useState(null); // custom program: which kind of save was last tried (draft | publish)
  const [attempts, setAttempts] = useState(0);
  const [pricing, setPricing] = useState(Number(draft.price) > 0 ? 'paid' : 'free');

  const subscription = isCustom ? getSubscription(db, requestId) : null;
  const termsLocked = ['active', 'expired'].includes(subscriptionState(subscription)); // price/duration frozen after payment
  const isPublished = isCustom ? getCustomProgram(db, requestId)?.status === PROGRAM_STATUS.PUBLISHED : draft.status === PROGRAM_STATUS.PUBLISHED;
  const request = isCustom ? db.requests.find((r) => r.id === requestId) : null;

  // Custom program: the errors are always recomputed from the draft, so fixing a field clears its error at once.
  const liveErrors = isCustom && attempt ? validateCustomProgram(draft, { mode: attempt }) : null;
  const current = liveErrors ?? errors;
  const error = (key) => (current[key] ? t(`field.${current[key]}`) : undefined);

  const touch = (key) => setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  const set = (key) => (value) => {
    setDraft({ ...draft, [key]: value });
    touch(key);
  };
  const setOffer = (key) => (value) => setDraft({ ...draft, offer: { ...draft.offer, [key]: value } });

  const problems = [
    ...FIELD_ORDER.filter((key) => current[key]).map((key) => ({ name: key, label: `${t(FIELD_LABEL[key])}: ${t(`field.${current[key]}`)}` })),
    ...Object.keys(current)
      .filter((key) => key.startsWith('target.') && current[key])
      .map((key) => {
        const [, id, part] = key.split('.');
        const exercise = db.exercises.find((e) => e.id === id);
        return { name: key, label: `${exercise ? exerciseName(exercise, lang) : id} — ${t(TARGET_LABEL[part])}: ${t('field.invalid')}` };
      }),
  ];
  const summaryTitle = t(isCustom && attempt === CUSTOM_MODE.DRAFT ? 'editor.fixToSave' : 'editor.fixToSend');

  // After a failed save, bring the error list into view (it is a live region, so it is announced as well).
  useEffect(() => {
    if (attempts) summaryRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [attempts]);

  const changePricing = (mode) => {
    setPricing(mode);
    setDraft({ ...draft, price: mode === 'free' ? 0 : Number(draft.price) || 100000 });
  };

  const submitCustom = (name, mode, publish) =>
    run(name, () => {
      setAttempt(mode);
      if (Object.keys(validateCustomProgram(draft, { mode })).length) return setAttempts((n) => n + 1);
      const result = saveCustom(requestId, draft, publish);
      if (!result.ok && result.error === 'validation') {
        setErrors(result.fields);
        setAttempts((n) => n + 1);
      }
    });

  const submitGeneral = (name, status) =>
    run(name, () => {
      const result = saveGeneral(status);
      if (!result.ok && result.error === 'validation') {
        setErrors(result.fields);
        setAttempts((n) => n + 1);
      }
    });

  const title = isCustom ? t('editor.customTitle') : editing ? t('editor.editGeneral') : t('editor.newGeneral');
  const sending = busy !== null;
  const targetErrors = Object.fromEntries(Object.entries(current).filter(([key, value]) => key.startsWith('target.') && value));
  const mealMissing = Boolean(request?.form?.wantsMealPlan) && !(draft.mealPlan?.meals?.length > 0);

  return (
    <Sheet title={title}>
      {attempts > 0 && <ErrorSummary items={problems} title={summaryTitle} containerRef={summaryRef} />}

      <Field name="title" label={t('editor.title')} value={draft.title} onChange={set('title')} error={error('title')} />

      {!isCustom && (
        <>
          <TextArea name="description" label={t('editor.description')} value={draft.description} onChange={set('description')} error={error('description')} />
          <ChipSelect multi label={t('editor.goals')} options={FOCUS_AREAS.map((id) => ({ value: id, label: t(`focus.${id}`) }))} value={draft.goals ?? []} onChange={set('goals')} />
          <SelectField label={t('editor.level')} value={draft.level} onChange={set('level')} options={LEVELS.map((id) => ({ value: id, label: t(`level.${id}`) }))} />
        </>
      )}

      <div className="form-grid">
        <Field name="durationWeeks" label={t('editor.weeks')} type="number" min="1" max="52" value={draft.durationWeeks} onChange={set('durationWeeks')} error={error('durationWeeks')} />
        <Field name="daysPerWeek" label={t('editor.days')} type="number" min="1" max="7" value={draft.daysPerWeek} onChange={set('daysPerWeek')} error={error('daysPerWeek')} />
      </div>

      {!isCustom && (
        <div className="field">
          <span>{t('editor.pricing')}</span>
          <Segmented value={pricing} onChange={changePricing} options={[{ value: 'free', label: t('common.free') }, { value: 'paid', label: t('editor.paid') }]} />
          {pricing === 'paid' && <MoneyField name="price" label={t('editor.price')} value={draft.price} onChange={set('price')} error={error('price')} />}
          <small className="field-hint">{t('editor.noCoachingNote')}</small>
        </div>
      )}

      {isCustom && (
        <section className="co-section">
          <h3>{t('editor.offer')}</h3>
          <p className="muted">{t(termsLocked ? 'editor.offerLocked' : 'editor.offerHelp')}</p>
          <div className="form-grid">
            <MoneyField name="price" label={t('co.offerPrice')} disabled={termsLocked} value={draft.offer?.price} onChange={setOffer('price')} error={error('price')} />
            <MoneyField name="renewalPrice" label={t('co.offerRenewal')} value={draft.offer?.renewalPrice} onChange={setOffer('renewalPrice')} error={error('renewalPrice')} hint={t('co.renewalHint')} />
            <Field name="durationDays" label={t('co.offerDays')} type="number" min="7" max="365" disabled={termsLocked} value={draft.offer?.durationDays} onChange={setOffer('durationDays')} error={error('durationDays')} />
          </div>
        </section>
      )}

      <TextArea name="notes" label={t(isCustom ? 'editor.coachingNotes' : 'editor.notes')} value={draft.notes} onChange={set('notes')} error={error('notes')} />
      <TextArea name="safety" label={t('editor.safety')} value={draft.safety} onChange={set('safety')} error={error('safety')} />

      <ExercisePlanner exercises={db.exercises} draft={draft} setDraft={(next) => { setDraft(next); touch('exercises'); }} decks={db.decks.filter((d) => d.owner === user.id)} error={error('exercises')} targetErrors={targetErrors} />

      {isCustom && request?.form?.wantsMealPlan !== undefined && (
        <div className={`note-box ${mealMissing ? 'warn' : ''}`} role="note">
          <Utensils size={16} aria-hidden="true" />
          <span>{t(request.form.wantsMealPlan ? (mealMissing ? 'editor.mealWantedMissing' : 'editor.mealWanted') : 'editor.mealNotWanted')}</span>
        </div>
      )}

      <MealPlanEditor value={draft.mealPlan ?? null} onChange={set('mealPlan')} />

      {isCustom ? (
        <div className="btns stack-btns">
          {!isPublished && (
            <button className="btn ghost" disabled={sending} aria-busy={busy === 'draft'} onClick={() => submitCustom('draft', CUSTOM_MODE.DRAFT, false)}>
              <Label busy={busy === 'draft'}>{t(busy === 'draft' ? 'editor.saving' : 'editor.saveDraft')}</Label>
            </button>
          )}
          <button className="btn" disabled={sending} aria-busy={busy === 'send'} onClick={() => submitCustom('send', CUSTOM_MODE.PUBLISH, !isPublished)}>
            <Label busy={busy === 'send'}>{t(busy === 'send' ? (isPublished ? 'editor.saving' : 'editor.sending') : isPublished ? 'editor.saveChanges' : 'editor.sendProposal')}</Label>
          </button>
        </div>
      ) : (
        <div className="btns stack-btns">
          <button className="btn ghost" disabled={sending} aria-busy={busy === 'draft'} onClick={() => submitGeneral('draft', PROGRAM_STATUS.DRAFT)}>
            <Label busy={busy === 'draft'}>{t(isPublished ? 'editor.unpublishSave' : 'editor.saveDraft')}</Label>
          </button>
          <button className="btn" disabled={sending} aria-busy={busy === 'send'} onClick={() => submitGeneral('send', PROGRAM_STATUS.PUBLISHED)}>
            <Label busy={busy === 'send'}>{t(isPublished ? 'editor.saveChanges' : 'editor.publish')}</Label>
          </button>
        </div>
      )}
    </Sheet>
  );
}
