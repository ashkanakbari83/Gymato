// The boundary between this app and a payment provider.
//
// A browser cannot be trusted to say "this was paid": anything it holds, the person using it can change. So the app
// never decides that on its own. It asks a PAYMENT SERVER (your backend, which talks to the real provider and keeps the
// orders) for two things, and acts only on what that server answers:
//
//   createSession(order) -> the server opens a payment with the provider and returns where to send the person
//   verify(order, params) -> the server asks the provider "was this order paid, and for how much?" and returns the answer
//
// The server address comes from VITE_PAYMENT_API_URL. Without it the gateway is "not configured": every call fails
// with `gateway_not_configured`, the order stays pending, and nothing unlocks. See docs/payments.md for the exact
// HTTP contract and what the server has to do.

export class GatewayError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

/** What a verification may say. `pending` = the provider has not settled it yet (not a failure). */
export const VERIFIED_STATUS = ['paid', 'failed', 'cancelled', 'pending'];

export const unconfiguredGateway = {
  configured: false,
  async createSession() {
    throw new GatewayError('gateway_not_configured');
  },
  async verify() {
    throw new GatewayError('gateway_not_configured');
  },
};

const isHttps = (value) => {
  try {
    const url = new URL(value, 'https://placeholder.invalid');
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname));
  } catch {
    return false;
  }
};

async function post(fetchImpl, url, body) {
  let response;
  try {
    response = await fetchImpl(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new GatewayError('network');
  }
  if (!response.ok) throw new GatewayError(`http_${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new GatewayError('bad_response');
  }
}

/**
 * Gateway that talks to a payment server over HTTP. The amount is never sent: the server reads the price of `kind` +
 * `targetId` from its own copy of the trainer's offer.
 */
export function httpGateway(base, { fetchImpl = (...args) => fetch(...args), returnUrl = () => location.origin + location.pathname } = {}) {
  const root = base.replace(/\/$/, '');
  return {
    configured: true,

    async createSession(order) {
      const data = await post(fetchImpl, `${root}/payments/sessions`, {
        orderId: order.id,
        kind: order.kind,
        targetId: order.targetId,
        returnUrl: `${returnUrl()}?pay=${encodeURIComponent(order.id)}`,
      });
      if (typeof data?.gatewayRef !== 'string' || !data.gatewayRef || !isHttps(data.redirectUrl)) throw new GatewayError('bad_response');
      return { gateway: String(data.gateway ?? 'unknown'), gatewayRef: data.gatewayRef, redirectUrl: data.redirectUrl };
    },

    async verify(order, params = {}) {
      const data = await post(fetchImpl, `${root}/payments/verify`, { orderId: order.id, gatewayRef: order.gatewayRef, returnParams: params });
      const valid = data && data.orderId === order.id && VERIFIED_STATUS.includes(data.status) && typeof data.gatewayRef === 'string' && Number.isFinite(data.amount);
      if (!valid) throw new GatewayError('bad_response');
      return { orderId: data.orderId, status: data.status, amount: data.amount, gatewayRef: data.gatewayRef, receipt: data.receipt ?? null };
    },
  };
}

let override = null;
/** Lets a test (or a host page) plug in another gateway. Pass null to go back to the configured one. */
export const setGateway = (gateway) => {
  override = gateway;
};

export function getGateway() {
  if (override) return override;
  const base = import.meta.env?.VITE_PAYMENT_API_URL;
  return base ? httpGateway(base) : unconfiguredGateway;
}
