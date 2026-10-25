// Demo checkout. Clearly labelled as a simulation: no real payment is made. Access is granted only by the
// "confirm" step, which is where a payment provider's confirmation would plug in later.
import { CreditCard, ShieldCheck } from 'lucide-react';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { PAYMENT_KIND } from '../lib/constants.js';
import { formatPrice, num } from '../lib/format.js';

export default function CheckoutModal({ paymentId }) {
  const { db, t, confirmDemoPayment, failDemoPayment, closeModal } = useApp();
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) return null;

  const isGeneral = payment.kind === PAYMENT_KIND.GENERAL;
  const subscription = isGeneral ? null : db.subscriptions.find((s) => s.id === payment.targetId);
  const program = isGeneral ? db.programs.find((p) => p.id === payment.targetId) : db.customPrograms.find((p) => p.id === subscription?.customProgramId);
  const trainer = db.users.find((u) => u.id === payment.trainerId);

  return (
    <Sheet title={t('pay.title')}>
      <p className="demo-banner"><ShieldCheck size={16} /> {t('pay.demoBanner')}</p>

      <dl className="detail-list">
        <div><dt>{t('pay.item')}</dt><dd>{program?.title}</dd></div>
        <div><dt>{t('pay.type')}</dt><dd>{t(`pay.kind.${payment.kind}`)}</dd></div>
        <div><dt>{t('pay.trainer')}</dt><dd>{trainer.name}</dd></div>
        {subscription && <div><dt>{t('pay.duration')}</dt><dd>{t('co.forDays', { n: num(subscription.durationDays) })}</dd></div>}
        <div className="total"><dt>{t('pay.total')}</dt><dd>{formatPrice(payment.amount, t)}</dd></div>
      </dl>

      <p className="notice-text">{t(isGeneral ? 'pay.generalIncludes' : 'pay.coachingIncludes')}</p>

      <button className="btn wide" onClick={() => confirmDemoPayment(payment.id)}>
        <CreditCard size={16} /> {t('pay.confirmDemo')}
      </button>
      <button className="btn danger wide" onClick={() => failDemoPayment(payment.id)}>{t('pay.simulateFail')}</button>
      <button className="btn ghost wide" onClick={closeModal}>{t('common.cancel')}</button>
      <p className="muted">{t('pay.lockedUntil')}</p>
    </Sheet>
  );
}
