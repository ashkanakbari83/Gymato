import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GatewayError, getGateway, httpGateway, setGateway, unconfiguredGateway } from '../payments/gateway.js';
import { withDefaults } from '../storage.js';

const order = { id: 'o1', kind: 'coaching_initial', targetId: 's1', gatewayRef: 'R1', amount: 800000 };
const reply = (data, ok = true, status = 200) => async () => ({ ok, status, json: async () => data });
const gw = (fetchImpl) => httpGateway('https://pay.example/api/', { fetchImpl, returnUrl: () => 'https://app.example/' });
const code = async (promise) => promise.then(() => null, (e) => (e instanceof GatewayError ? e.code : `other:${e.message}`));

test('without a payment server configured, nothing can be started or verified', async () => {
  setGateway(null);
  assert.equal(getGateway(), unconfiguredGateway);
  assert.equal(getGateway().configured, false);
  assert.equal(await code(getGateway().createSession(order)), 'gateway_not_configured');
  assert.equal(await code(getGateway().verify(order)), 'gateway_not_configured');
});

test('a session request never carries an amount; the server reads the price itself', async () => {
  let sent;
  const gateway = gw(async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return { ok: true, json: async () => ({ gateway: 'x', gatewayRef: 'R1', redirectUrl: 'https://bank.example/pay/R1' }) }; });
  const session = await gateway.createSession(order);
  assert.equal(sent.url, 'https://pay.example/api/payments/sessions');
  assert.deepEqual(Object.keys(sent.body).sort(), ['kind', 'orderId', 'returnUrl', 'targetId']);
  assert.equal(sent.body.returnUrl, 'https://app.example/?pay=o1');
  assert.equal(session.gatewayRef, 'R1');
});

test('a session answer that is malformed or redirects to a non-https page is refused', async () => {
  assert.equal(await code(gw(reply({ gatewayRef: 'R1', redirectUrl: 'javascript:alert(1)' })).createSession(order)), 'bad_response');
  assert.equal(await code(gw(reply({ gatewayRef: 'R1', redirectUrl: 'http://evil.example/' })).createSession(order)), 'bad_response');
  assert.equal(await code(gw(reply({ redirectUrl: 'https://bank.example/' })).createSession(order)), 'bad_response');
  assert.equal(await code(gw(reply({}, false, 500)).createSession(order)), 'http_500');
  assert.equal(await code(gw(async () => { throw new Error('offline'); }).createSession(order)), 'network');
});

test('a verification answer must be about this order and have a known status and a numeric amount', async () => {
  const good = { orderId: 'o1', status: 'paid', amount: 800000, gatewayRef: 'R1' };
  assert.deepEqual(await gw(reply(good)).verify(order, { Authority: 'a' }), { ...good, receipt: null });
  assert.equal(await code(gw(reply({ ...good, orderId: 'other' })).verify(order)), 'bad_response');
  assert.equal(await code(gw(reply({ ...good, status: 'success' })).verify(order)), 'bad_response');
  assert.equal(await code(gw(reply({ ...good, amount: '800000' })).verify(order)), 'bad_response');
});

test('saved orders from before the rework are read as pending / paid with their dates kept', () => {
  const state = withDefaults({ payments: [
    { id: 'a', status: 'initiated', confirmedAt: null },
    { id: 'b', status: 'confirmed', confirmedAt: '2026-10-01T00:00:00.000Z' },
    { id: 'c', status: 'failed', confirmedAt: null },
  ] });
  assert.deepEqual(state.payments.map((p) => p.status), ['pending', 'paid', 'failed']);
  assert.equal(state.payments[1].paidAt, '2026-10-01T00:00:00.000Z');
  assert.equal('confirmedAt' in state.payments[1], false);
});
