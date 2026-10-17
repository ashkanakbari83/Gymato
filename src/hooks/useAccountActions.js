// Account actions: sign-up, coach/athlete linking and the coach subscription.
import { uid, makePublicId } from '../lib/format';

/** Sign-up, coach <-> athlete linking and the coach subscription. */
export function useAccountActions({ user, update, notify, closeModal, changeUser }) {
  const notification = (userId, title, text) => ({ id: uid(), userId, title, text, read: false });

  const signUp = (form) => {
    const id = uid();
    const isCoach = form.role === 'coach';
    update((d) => ({
      users: [
        ...d.users,
        {
          id,
          name: form.name.trim(),
          role: form.role,
          roles: [form.role],
          goal: isCoach ? 'مربی‌گری' : form.goal,
          level: isCoach ? 'پیشرفته' : form.level,
          height: isCoach ? '' : Number(form.height) || '',
          weight: isCoach ? '' : Number(form.weight) || '',
          publicId: makePublicId(d.users),
          ...(isCoach ? { plan: 'free' } : {}),
        },
      ],
    }));
    closeModal();
    changeUser(id);
  };

  /** Coach adds an athlete found by public ID. */
  const linkAthlete = (athlete) => {
    update((d) => ({
      users: d.users.map((u) => (u.id === athlete.id ? { ...u, coachId: user.id } : u)),
      notifications: [notification(athlete.id, 'مربی جدید', `${user.name} تو را به لیست شاگردانش اضافه کرد.`), ...d.notifications],
    }));
    closeModal();
    notify(`${athlete.name} به شاگردان اضافه شد`);
  };

  /** Athlete picks a coach. */
  const chooseCoach = (coach) => {
    update((d) => ({
      users: d.users.map((u) => (u.id === user.id ? { ...u, coachId: coach.id } : u)),
      notifications: [notification(coach.id, 'شاگرد جدید', `${user.name} تو را به‌عنوان مربی انتخاب کرد.`), ...d.notifications],
    }));
    closeModal();
    notify('مربی انتخاب شد');
  };

  const upgradePlan = () => {
    update((d) => ({ users: d.users.map((u) => (u.id === user.id ? { ...u, plan: 'pro' } : u)) }));
    closeModal();
    notify('اشتراک آزمایشی فعال شد');
  };

  return { signUp, linkAthlete, chooseCoach, upgradePlan };
}
