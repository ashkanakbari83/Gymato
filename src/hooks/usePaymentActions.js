// Checkout. Starting one creates a pending order; only an answer from the payment server (via the gateway adapter)
// can turn it into a paid one. With no payment server configured, nothing here can unlock anything.
import { useCallback, useEffect, useRef } from 'react';
import { applyGatewayResult, attachGatewaySession, cancelPayment, startCheckout } from '../lib/domain/payments.js';
import { GatewayError, getGateway } from '../lib/payments/gateway.js';

const RESULT_TEXT = { paid: 'pay.result.paid', failed: 'pay.result.failed', cancelled: 'pay.result.cancelled', pending: 'pay.result.pending', already_paid: 'pay.result.paid' };

export function usePaymentActions({ db, user, notify, t, dispatch, openModal, closeModal }) {
  /** kind: 'general_purchase' | 'coaching_initial' | 'coaching_renewal'; targetId: program or subscription id. */
  const openCheckout = (kind, targetId) => {
    const result = dispatch(startCheckout, user.id, { kind, targetId });
    if (result.ok) openModal({ type: 'checkout', paymentId: result.payment.id });
  };

  /** Sends the person to the provider. Returns { ok } or { ok:false, error }; the order stays pending either way. */
  const startGatewayPayment = async (paymentId) => {
    const order = db.payments.find((p) => p.id === paymentId);
    if (!order || order.status !== 'pending') return { ok: false, error: 'invalid_transition' };
    try {
      const session = await getGateway().createSession(order); // the server answers the same session for the same order
      const saved = dispatch(attachGatewaySession, user.id, paymentId, session);
      if (!saved.ok) return saved;
      window.location.assign(session.redirectUrl);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof GatewayError ? error.code : 'unknown' };
    }
  };

  /** Asks the payment server what became of an order and applies the answer. Safe to repeat. */
  const verifyPayment = useCallback(async (paymentId, params = {}) => {
    const order = db.payments.find((p) => p.id === paymentId);
    if (!order) return { ok: false, error: 'forbidden' };
    try {
      const answer = await getGateway().verify(order, params);
      const result = dispatch(applyGatewayResult, user.id, answer);
      if (result.ok) notify(t(RESULT_TEXT[result.outcome]), result.outcome === 'paid' || result.outcome === 'already_paid' ? undefined : 'alert');
      return result;
    } catch (error) {
      return { ok: false, error: error instanceof GatewayError ? error.code : 'unknown' };
    }
  }, [db.payments, dispatch, notify, t, user.id]);

  const cancelOrder = (paymentId) => {
    const result = dispatch(cancelPayment, user.id, paymentId);
    if (result.ok) {
      closeModal();
      notify(t('pay.result.cancelled'), 'alert');
    }
    return result;
  };

  return { openCheckout, startGatewayPayment, verifyPayment, cancelOrder };
}

/**
 * Coming back from the gateway: the address carries `?pay=<order id>` plus whatever the provider added. That alone
 * proves nothing, so it is handed to the payment server to check, and the address is cleaned up either way.
 */
export function usePaymentReturn({ signedIn, verifyPayment, openModal }) {
  const handled = useRef(false);
  useEffect(() => {
    if (!signedIn || handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('pay');
    if (!orderId) return;
    handled.current = true;
    params.delete('pay');
    const rest = Object.fromEntries(params);
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
    verifyPayment(orderId, rest).then(() => openModal({ type: 'checkout', paymentId: orderId }));
  }, [signedIn, verifyPayment, openModal]);
}
