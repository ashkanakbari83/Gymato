// Checkout. Shows the order (price taken from the trainer's offer) and its payment status.
// The "Pay" button sends the person to the payment provider through the payment server; nothing here can mark an order
// as paid by itself. If no payment server is configured, the order is shown as pending and the button is disabled.
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import PaymentStatus from '../components/payments/PaymentStatus.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useBusy } from '../hooks/useBusy.js';
import { PAYMENT_KIND, PAYMENT_STATUS } from '../lib/constants.js';
import { formatPrice, num } from '../lib/format.js';
import { getGateway } from '../lib/payments/gateway.js';
import { useState } from 'react';

export default function CheckoutModal({ paymentId }) {
  const { db, t, startGatewayPayment, verifyPayment, cancelOrder, openCheckout, closeModal, notify } = useApp();
  const { busy, run } = useBusy();
  const [problem, setProblem] = useState(null);
  const payment = db.payments.find((p) => p.id === paymentId);
  if (!payment) return null;

  const configured = getGateway().configured;
  const isGeneral = payment.kind === PAYMENT_KIND.GENERAL;
  const subscription = isGeneral ? null : db.subscriptions.find((s) => s.id === payment.targetId);
  const program = isGeneral ? db.programs.find((p) => p.id === payment.targetId) : db.customPrograms.find((p) => p.id === subscription?.customProgramId);
  const trainer = db.users.find((u) => u.id === payment.trainerId);
  const pending = payment.status === PAYMENT_STATUS.PENDING;
  const sent = Boolean(payment.gatewayRef); // the person was already sent to the provider once

  const pay = () => run('pay', async () => {
    const result = await startGatewayPayment(payment.id);
    setProblem(result.ok ? null : result.error);
  });
  const check = () => run('check', async () => {
    const result = await verifyPayment(payment.id);
    setProblem(result.ok ? null : result.error);
  });
  const tryAgain = () => {
    closeModal();
    openCheckout(payment.kind, payment.targetId);
    notify(t('pay.newOrder'));
  };

  return (
    <Sheet title={t('pay.title')}>
      <div className="pay-status-row">
        <span>{t('pay.statusLabel')}</span>
        <PaymentStatus status={payment.status} />
      </div>

      <dl className="detail-list">
        <div><dt>{t('pay.item')}</dt><dd>{program?.title}</dd></div>
        <div><dt>{t('pay.type')}</dt><dd>{t(`pay.kind.${payment.kind}`)}</dd></div>
        <div><dt>{t('pay.trainer')}</dt><dd>{trainer?.name}</dd></div>
        {subscription && <div><dt>{t('pay.duration')}</dt><dd>{t('co.forDays', { n: num(subscription.durationDays) })}</dd></div>}
        <div className="total"><dt>{t('pay.total')}</dt><dd>{formatPrice(payment.amount, t)}</dd></div>
      </dl>

      {pending && !configured && (
        <div className="note-box warn" role="status">
          <AlertTriangle size={16} aria-hidden="true" /> <b>{t('pay.notConfiguredTitle')}</b>
          <p>{t('pay.notConfiguredText')}</p>
        </div>
      )}
      {problem && <p className="field-error" role="alert">{t(`pay.error.${problem}`)}</p>}

      {payment.status === PAYMENT_STATUS.PAID && <p className="note-box" role="status">{t('pay.paidNote')}</p>}
      {[PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED].includes(payment.status) && (
        <>
          <p className="note-box warn" role="status">{t(payment.failureReason === 'amount_mismatch' ? 'pay.mismatchNote' : 'pay.notUnlocked')}</p>
          <button className="btn wide" onClick={tryAgain}>{t('pay.tryAgain')}</button>
        </>
      )}

      {pending && (
        <>
          <p className="notice-text">{t(isGeneral ? 'pay.generalIncludes' : 'pay.coachingIncludes')}</p>
          <button className="btn wide" disabled={!configured || busy !== null} aria-busy={busy === 'pay'} onClick={pay}>
            {busy === 'pay' ? <Spinner /> : <CreditCard size={16} />} {t(busy === 'pay' ? 'pay.redirecting' : sent ? 'pay.continue' : 'pay.payNow')}
          </button>
          {sent && (
            <button className="btn ghost wide" disabled={!configured || busy !== null} aria-busy={busy === 'check'} onClick={check}>
              {busy === 'check' ? <Spinner /> : <RefreshCw size={16} />} {t('pay.checkStatus')}
            </button>
          )}
          {!sent && <button className="btn ghost wide" onClick={() => cancelOrder(payment.id)}>{t('pay.cancelOrder')}</button>}
          <p className="muted">{t('pay.lockedUntil')}</p>
        </>
      )}
      <button className="btn ghost wide" onClick={closeModal}>{t('common.close')}</button>
    </Sheet>
  );
}
