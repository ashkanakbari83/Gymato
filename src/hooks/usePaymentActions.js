// Demo checkout. Opening a checkout creates an "initiated" payment; only confirming it unlocks access.
import { confirmPayment, failPayment, startCheckout } from '../lib/domain/payments.js';

export function usePaymentActions({ user, notify, t, dispatch, openModal, closeModal }) {
  /** kind: 'general_purchase' | 'coaching_initial' | 'coaching_renewal'; targetId: program or subscription id. */
  const openCheckout = (kind, targetId) => {
    const result = dispatch(startCheckout, user.id, { kind, targetId });
    if (result.ok) openModal({ type: 'checkout', paymentId: result.payment.id });
  };

  const confirmDemoPayment = (paymentId) => {
    const result = dispatch(confirmPayment, user.id, paymentId);
    if (result.ok) {
      closeModal();
      notify(t('pay.confirmedDemo'));
    }
    return result;
  };

  const failDemoPayment = (paymentId) => {
    const result = dispatch(failPayment, user.id, paymentId);
    if (result.ok) {
      closeModal();
      notify(t('pay.failedDemo'));
    }
  };

  return { openCheckout, confirmDemoPayment, failDemoPayment };
}
