// Explicit state machines. Request, payment, subscription and program statuses are independent;
// every status change goes through canTransition() before it is applied.
import { PAYMENT_STATUS as P, PROGRAM_STATUS as G, REQUEST_STATUS as R, SUBSCRIPTION_STATUS as S } from './constants.js';

export const TRANSITIONS = {
  /** Custom coaching request. Acceptance, rejection and withdrawal are final. */
  request: {
    [R.PENDING]: [R.ACCEPTED, R.REJECTED, R.CANCELLED],
    [R.ACCEPTED]: [],
    [R.REJECTED]: [],
    [R.CANCELLED]: [],
  },
  /** One payment attempt. Only a confirmed payment can unlock anything. */
  payment: {
    [P.INITIATED]: [P.CONFIRMED, P.FAILED],
    [P.CONFIRMED]: [],
    [P.FAILED]: [],
  },
  /** Coaching subscription. Expiry is derived from endAt; renewal moves expired -> active. */
  subscription: {
    [S.PENDING]: [S.ACTIVE, S.CANCELLED],
    [S.ACTIVE]: [S.EXPIRED, S.CANCELLED],
    [S.EXPIRED]: [S.ACTIVE],
    [S.CANCELLED]: [],
  },
  /** Program visibility (general programs may be unpublished; a published custom program stays published). */
  program: {
    [G.DRAFT]: [G.PUBLISHED],
    [G.PUBLISHED]: [G.DRAFT],
  },
};

export const canTransition = (machine, from, to) => TRANSITIONS[machine]?.[from]?.includes(to) ?? false;
