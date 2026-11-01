# Payments: what is built and what real payment needs

## The rule

A browser can't prove that money was paid. Anything the app holds in `localStorage` or in a variable can be edited by
the person using it. So this app **never** marks an order as paid by itself. An order becomes `paid` only when
`applyGatewayResult` receives an answer that the **payment server** gave after asking the real provider.
There is no "confirm" button and no demo mode.

## What is built (front end)

| Piece | File | Job |
|---|---|---|
| Order states | `lib/constants.js`, `lib/transitions.js` | `pending → paid / failed / cancelled`; the last three are final |
| Domain rules | `lib/domain/payments.js` | create order, attach gateway session, cancel, apply a server answer |
| Gateway adapter | `lib/payments/gateway.js` | the only code that talks to a payment server |
| Actions | `hooks/usePaymentActions.js` | pay, check status, cancel, handle the return from the gateway |
| UI | `modals/CheckoutModal.jsx`, `components/payments/PaymentStatus.jsx` | order, status for both roles, history |

Rules enforced in the domain (all unit-tested):

- The amount is read from the trainer's offer (`subscription.price` / `renewalPrice` / `program.price`) when the order is created. The client never sends an amount to the server.
- Nothing is activated for a `pending`, `failed` or `cancelled` order. A failed or cancelled order is final; retrying creates a new order.
- Closing the payment page changes nothing: the order stays `pending`. Only an explicit "Cancel order" cancels it, and only before the person was sent to the provider.
- A second click, a refresh, or a repeated answer for the same order reuses the order and never activates twice (`already_paid`).
- A `paid` answer is refused unless it carries the order's own `gatewayRef` and exactly the order's amount; a different amount marks the order `failed` with `needsReview`.
- One gateway reference can belong to one order only.
- While an order is at the provider, the trainer cannot change the price or duration of that offer.
- Coming back from the gateway (`?pay=<order id>`) proves nothing; the address is cleaned and the order is verified with the server.

## What is NOT possible without infrastructure

With no payment server (the default, `VITE_PAYMENT_API_URL` unset):

- the checkout shows "The payment gateway is not connected yet", the order is saved as **pending**, the Pay button is disabled;
- no custom coaching can be activated, renewed, or paid for, and no paid general program can be bought;
- free programs and everything that does not involve money keep working.

This is intentional. The old demo that activated programs from the client was removed.

## What a real deployment needs

1. **A backend** (Node, Laravel, Django… anything) with a database that holds the source of truth: users, trainer offers (price, renewal price, duration), orders and entitlements.
2. **A merchant account with an Iranian or international provider** (for example Zarinpal, IDPay, Pay.ir, NextPay, or Stripe outside Iran), its **merchant ID / secret key**, a verified domain, and the callback URL registered with the provider. The secret key lives only on the server.
3. **HTTPS** for both the app and the API (providers require it; the adapter refuses non-https redirects).
4. **The API below**, and `VITE_PAYMENT_API_URL=https://your-api.example/api` set when building the app.

### HTTP contract (the app calls these; cookies are sent with `credentials: include`)

`POST /payments/sessions`

```json
{ "orderId": "…", "kind": "coaching_initial | coaching_renewal | general_purchase", "targetId": "…", "returnUrl": "https://app/?pay=<orderId>" }
```

The server must: authenticate the athlete; load the trainer's offer **from its own database** for `kind` + `targetId` and compute the amount itself; create (or return the existing, for the same `orderId`) payment with the provider; store `orderId → amount, gatewayRef, athlete`. Response:

```json
{ "gateway": "zarinpal", "gatewayRef": "<provider authority/token>", "redirectUrl": "https://provider/pay/<token>" }
```

`POST /payments/verify`

```json
{ "orderId": "…", "gatewayRef": "…", "returnParams": { "…": "whatever the provider added to the return URL" } }
```

The server must: look the order up in **its** database; call the provider's verify endpoint; check the provider's amount equals the stored amount; make the result idempotent. Response:

```json
{ "orderId": "…", "status": "paid | failed | cancelled | pending", "amount": 800000, "gatewayRef": "…", "receipt": "optional" }
```

### The honest limit of a client-only app

Even with the contract above, this app keeps its data in the browser, so a determined person can edit their own saved data. The server answer stops *accidental and casual* misuse and makes the money side correct, but **real tamper-resistance needs the server to own entitlements too**: the server should decide "this athlete has access to this program / this subscription is active until X" and the app should read that, instead of deriving it from local data. That is a larger migration (accounts, programs, subscriptions and chat on a server), not a payment-screen change.
