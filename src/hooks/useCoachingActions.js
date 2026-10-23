// Custom coaching: requests, decisions, the private program, and chat.
import { getCustomProgram, getSubscription } from '../lib/access.js';
import { acceptRequest, cancelRequest, rejectRequest, saveCustomProgram, sendMessage, submitRequest } from '../lib/domain/coaching.js';

export function useCoachingActions({ db, user, notify, t, dispatch, openModal, closeModal, setDraft }) {
  const requestCoaching = (trainerId, form) => {
    const result = dispatch(submitRequest, user.id, trainerId, form);
    if (result.ok) {
      closeModal();
      notify(t('cr.sent'));
    }
    return result;
  };

  const withdrawRequest = (requestId) => {
    if (!confirm(t('co.confirmWithdraw'))) return;
    const result = dispatch(cancelRequest, user.id, requestId);
    if (result.ok) notify(t('co.withdrawn'));
  };

  const accept = (requestId, offer) => {
    const result = dispatch(acceptRequest, user.id, requestId, offer);
    if (result.ok) notify(t('co.accepted'));
    return result;
  };

  const reject = (requestId, reason) => {
    const result = dispatch(rejectRequest, user.id, requestId, reason);
    if (result.ok) notify(t('co.rejected'));
    return result;
  };

  /** Opens the editor for this client's program (a draft pre-filled from the request when none exists yet). */
  const openCustomEditor = (requestId) => {
    const request = db.requests.find((r) => r.id === requestId);
    const program = getCustomProgram(db, requestId);
    const subscription = getSubscription(db, requestId);
    const offer = subscription
      ? { price: subscription.price, renewalPrice: subscription.renewalPrice, durationDays: subscription.durationDays }
      : request.offer;
    setDraft(
      program
        ? { ...program, exercises: [...program.exercises], targets: { ...program.targets }, offer }
        : {
            title: t('co.defaultTitle', { name: request.form.name }),
            notes: '',
            safety: '',
            daysPerWeek: request.form.daysPerWeek,
            durationWeeks: Math.max(1, Math.round(offer.durationDays / 7)),
            exercises: [],
            targets: {},
            sessions: [],
            offer,
          },
    );
    openModal({ type: 'program-editor', kind: 'custom', requestId });
  };

  /** Save the editor's draft as the client's program; `publish` sends it as a proposal awaiting payment. */
  const saveCustom = (requestId, draft, publish) => {
    const result = dispatch(saveCustomProgram, user.id, requestId, draft, { publish });
    if (result.ok) {
      closeModal();
      notify(t(publish ? 'co.proposalSent' : 'co.programSaved'));
    }
    return result;
  };

  const postMessage = (conversationId, text) => dispatch(sendMessage, user.id, conversationId, text);

  return { requestCoaching, withdrawRequest, accept, reject, openCustomEditor, saveCustom, postMessage };
}
