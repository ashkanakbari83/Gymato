// Account actions: sign-up, profile edits and notification handling.
import { makePublicId, uid } from '../lib/format.js';

export function useAccountActions({ user, update, notify, t, closeModal, changeUser, go, openModal }) {
  const signUp = (form) => {
    const id = uid();
    const isTrainer = form.role === 'coach';
    update((d) => ({
      users: [
        ...d.users,
        {
          id,
          name: form.name.trim(),
          role: form.role,
          roles: [form.role],
          publicId: makePublicId(d.users),
          province: form.province || '',
          city: form.city || '',
          ...(isTrainer
            ? { specialties: [], bio: '', experienceYears: 0, offersCoaching: true }
            : { age: Number(form.age) || '', height: Number(form.height) || '', weight: Number(form.weight) || '', goal: form.goal, level: form.level }),
        },
      ],
    }));
    closeModal();
    changeUser(id);
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

  return { signUp, updateProfile, markNotificationsRead, openTarget };
}
