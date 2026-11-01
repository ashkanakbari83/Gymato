// Test-only stand-in for the payment server. In the app, the answer below comes from the real payment server through
// lib/payments/gateway.js; here we write it by hand so the domain rules can be exercised.
import assert from 'node:assert/strict';
import { applyGatewayResult, attachGatewaySession } from '../domain/payments.js';

/** The order was sent to the provider (a session exists). */
export function sendToGateway(db, athleteId, paymentId, now) {
  const r = attachGatewaySession(db, athleteId, paymentId, { gateway: 'test', gatewayRef: `gw-${paymentId}` }, now);
  assert.equal(r.ok, true, `attach failed: ${r.error}`);
  return r.db;
}

/** What the payment server would answer for this order. Override fields to simulate a tampered or odd answer. */
export const serverAnswer = (db, paymentId, patch = {}) => {
  const order = db.payments.find((p) => p.id === paymentId);
  return { orderId: order.id, status: 'paid', amount: order.amount, gatewayRef: `gw-${order.id}`, ...patch };
};

/** Sends the order to the gateway and applies a verified "paid" answer; returns the new db. */
export function settlePaid(db, athleteId, paymentId, now) {
  const sent = sendToGateway(db, athleteId, paymentId, now);
  const r = applyGatewayResult(sent, athleteId, serverAnswer(sent, paymentId), now);
  assert.equal(r.ok, true, `settle failed: ${r.error}`);
  return r.db;
}
