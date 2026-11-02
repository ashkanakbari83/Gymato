// Pending request, trainer side: accept with a proposed offer, or reject.
import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { Field } from '../ui/Field.jsx';
import MoneyField from '../ui/MoneyField.jsx';

export default function TrainerDecision({ request }) {
  const { db, accept, reject, t } = useApp();
  // Pre-fill from the trainer's most recent proposal so a returning trainer only confirms the numbers.
  const last = db.requests
    .filter((r) => r.trainerId === request.trainerId && r.offer)
    .sort((a, b) => new Date(b.decidedAt ?? 0) - new Date(a.decidedAt ?? 0))[0]?.offer;
  const [offer, setOffer] = useState(
    last ? { price: String(last.price), renewalPrice: String(last.renewalPrice), durationDays: last.durationDays } : { price: '', renewalPrice: '', durationDays: 30 },
  );
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setOffer((o) => ({ ...o, [key]: value }));
  const error = (key) => (errors[key] ? t(`field.${errors[key]}`) : undefined);

  const submitAccept = () => {
    const result = accept(request.id, offer);
    if (!result.ok && result.error === 'validation') setErrors(result.fields);
  };

  const submitReject = () => {
    if (confirm(t('co.confirmReject'))) reject(request.id, reason);
  };

  return (
    <section className="co-section">
      <h3>{t('co.decision')}</h3>
      <p className="muted">{t('co.decisionHelp')}</p>
      {last && <p className="muted">{t('co.offerPrefilled')}</p>}
      <div className="form-grid">
        <MoneyField label={t('co.offerPrice')} value={offer.price} onChange={set('price')} error={error('price')} />
        <MoneyField label={t('co.offerRenewal')} value={offer.renewalPrice} onChange={set('renewalPrice')} error={error('renewalPrice')} hint={t('co.renewalHint')} />
        <Field label={t('co.offerDays')} type="number" min="7" max="365" value={offer.durationDays} onChange={set('durationDays')} error={error('durationDays')} />
      </div>
      <button className="btn wide" onClick={submitAccept}>
        {t('co.accept')}
      </button>
      <Field label={t('co.rejectReason')} value={reason} onChange={setReason} maxLength={300} />
      <button className="btn danger wide" onClick={submitReject}>
        {t('co.reject')}
      </button>
    </section>
  );
}
