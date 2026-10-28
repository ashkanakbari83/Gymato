// Account actions: sign-up, sign-in / sign-out, profile edits and notification handling.
import { findAccounts, registerAccount, signInAs, signOut } from '../lib/domain/accounts.js';

export function useAccountActions({ db, user, update, notify, t, closeModal, go, openModal, dispatch, setWorkout }) {
  /** A running workout belongs to its athlete; another account never inherits it. */
  const keepOwnWorkout = (userId) => setWorkout((w) => (w && w.userId !== userId ? null : w));

  /** Accounts matching a mobile number / username and password (more than one for the shared admin login). */
  const findLogin = (identifier, password) => findAccounts(db, identifier, password);

  const signInTo = (userId) => {
    const result = dispatch(signInAs, userId);
    if (result.ok) {
      keepOwnWorkout(userId);
      go('home');
    }
    return result;
  };

  const logout = () => {
    dispatch(signOut);
    closeModal();
    go('home');
  };

  /** Creates the account and signs it in. Returns the domain result so the form can show field errors. */
  const signUp = (form) => {
    const result = dispatch(registerAccount, form);
    if (result.ok) {
      keepOwnWorkout(result.user.id);
      go('home');
      notify(t('auth.welcome', { name: result.user.name }));
    }
    return result;
  };

  const updateProfile = (changes) => {
    update((d) => ({ users: d.users.map((u) => (u.id === user.id ? { ...u, ...changes } : u)) }));
    notify(t('profile.saved'));
  };

  const markNotificationsRead = () =>
    update((d) => ({ notifications: d.notifications.map((n) => (n.userId === user.id ? { ...n, read: true } : n)) }));

  /** Follow a notification's `target` (see withNotification). */
  const openTarget = (target) => {
    if (!target) return;
    closeModal();
    if (target.kind === 'coaching') openModal({ type: 'coaching', requestId: target.requestId });
    else if (target.kind === 'page') go(target.page);
  };

  return { signUp, signInTo, findLogin, logout, updateProfile, markNotificationsRead, openTarget };
}
