// One editor for both program types.
//  - general: a public listing (description, goals, level, price, publication status)
//  - custom : a private program for one athlete, plus the coaching offer (price, renewal price, duration)
import { useState } from 'react';
import ExercisePlanner from '../components/exercise/ExercisePlanner.jsx';
import MealPlanEditor from '../components/nutrition/MealPlanEditor.jsx';
import { ChipSelect, Field, SelectField, Segmented, TextArea } from '../components/ui/Field.jsx';
import MoneyField from '../components/ui/MoneyField.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getCustomProgram, getSubscription, subscriptionState } from '../lib/access.js';
import { FOCUS_AREAS, LEVELS, PROGRAM_STATUS } from '../lib/constants.js';

export default function ProgramEditorModal({ kind, requestId, editing }) {
  const { db, user, draft, setDraft, saveGeneral, saveCustom, t } = useApp();
  const isCustom = kind === 'custom';
  const [errors, setErrors] = useState({});
  const [pricing, setPricing] = useState(Number(draft.price) > 0 ? 'paid' : 'free');

  const subscription = isCustom ? getSubscription(db, requestId) : null;
  const termsLocked = ['active', 'expired'].includes(subscriptionState(subscription)); // price/duration frozen after payment
  const isPublished = isCustom ? getCustomProgram(db, requestId)?.status === PROGRAM_STATUS.PUBLISHED : draft.status === PROGRAM_STATUS.PUBLISHED;

  const set = (key) => (value) => setDraft({ ...draft, [key]: value });
  const setOffer = (key) => (value) => setDraft({ ...draft, offer: { ...draft.offer, [key]: value } });
  const error = (key) => (errors[key] ? t(`field.${errors[key]}`) : undefined);
  const handle = (result) => {
    if (!result.ok && result.error === 'validation') setErrors(result.fields);
  };

  const changePricing = (mode) => {
    setPricing(mode);
    setDraft({ ...draft, price: mode === 'free' ? 0 : Number(draft.price) || 100000 });
  };

  const title = isCustom ? t('editor.customTitle') : editing ? t('editor.editGeneral') : t('editor.newGeneral');

  return (
    <Sheet title={title}>
      <Field label={t('editor.title')} value={draft.title} onChange={set('title')} error={error('title')} />

      {!isCustom && (
        <>
          <TextArea label={t('editor.description')} value={draft.description} onChange={set('description')} error={error('description')} />
          <ChipSelect multi label={t('editor.goals')} options={FOCUS_AREAS.map((id) => ({ value: id, label: t(`focus.${id}`) }))} value={draft.goals ?? []} onChange={set('goals')} />
          <SelectField label={t('editor.level')} value={draft.level} onChange={set('level')} options={LEVELS.map((id) => ({ value: id, label: t(`level.${id}`) }))} />
        </>
      )}

      <div className="form-grid">
        <Field label={t('editor.weeks')} type="number" min="1" max="52" value={draft.durationWeeks} onChange={set('durationWeeks')} error={error('durationWeeks')} />
        <Field label={t('editor.days')} type="number" min="1" max="7" value={draft.daysPerWeek} onChange={set('daysPerWeek')} error={error('daysPerWeek')} />
      </div>

      {!isCustom && (
        <div className="field">
          <span>{t('editor.pricing')}</span>
          <Segmented value={pricing} onChange={changePricing} options={[{ value: 'free', label: t('common.free') }, { value: 'paid', label: t('editor.paid') }]} />
          {pricing === 'paid' && <MoneyField label={t('editor.price')} value={draft.price} onChange={set('price')} error={error('price')} />}
          <small className="field-hint">{t('editor.noCoachingNote')}</small>
        </div>
      )}

      {isCustom && (
        <section className="co-section">
          <h3>{t('editor.offer')}</h3>
          <p className="muted">{t(termsLocked ? 'editor.offerLocked' : 'editor.offerHelp')}</p>
          <div className="form-grid">
            <MoneyField label={t('co.offerPrice')} disabled={termsLocked} value={draft.offer?.price} onChange={setOffer('price')} error={error('price')} />
            <MoneyField label={t('co.offerRenewal')} value={draft.offer?.renewalPrice} onChange={setOffer('renewalPrice')} error={error('renewalPrice')} hint={t('co.renewalHint')} />
            <Field label={t('co.offerDays')} type="number" min="7" max="365" disabled={termsLocked} value={draft.offer?.durationDays} onChange={setOffer('durationDays')} error={error('durationDays')} />
          </div>
        </section>
      )}

      <TextArea label={t(isCustom ? 'editor.coachingNotes' : 'editor.notes')} value={draft.notes} onChange={set('notes')} />
      <TextArea label={t('editor.safety')} value={draft.safety} onChange={set('safety')} />

      <ExercisePlanner exercises={db.exercises} draft={draft} setDraft={setDraft} decks={db.decks.filter((d) => d.owner === user.id)} error={error('exercises')} />

      <MealPlanEditor value={draft.mealPlan ?? null} onChange={set('mealPlan')} />

      {isCustom ? (
        <div className="btns stack-btns">
          {!isPublished && <button className="btn ghost" onClick={() => handle(saveCustom(requestId, draft, false))}>{t('editor.saveDraft')}</button>}
          <button className="btn" onClick={() => handle(saveCustom(requestId, draft, !isPublished))}>{t(isPublished ? 'editor.saveChanges' : 'editor.sendProposal')}</button>
        </div>
      ) : (
        <div className="btns stack-btns">
          <button className="btn ghost" onClick={() => handle(saveGeneral(PROGRAM_STATUS.DRAFT))}>{t(isPublished ? 'editor.unpublishSave' : 'editor.saveDraft')}</button>
          <button className="btn" onClick={() => handle(saveGeneral(PROGRAM_STATUS.PUBLISHED))}>{t(isPublished ? 'editor.saveChanges' : 'editor.publish')}</button>
        </div>
      )}
    </Sheet>
  );
}
