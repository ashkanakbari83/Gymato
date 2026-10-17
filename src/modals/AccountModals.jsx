// Account sheets: profile switcher, sign-up, notifications, coach choice and subscription.
import { Bell, Check, ChevronLeft, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';
import Empty from '../components/ui/Empty';
import { Field, SelectField } from '../components/ui/Field';
import Sheet from '../components/ui/Sheet';
import { useApp } from '../context/AppContext';
import { FREE_ATHLETE_LIMIT, GOALS, LEVELS } from '../lib/constants';
import { faNum } from '../lib/format';
import { getNotifications } from '../lib/selectors';

const roleLabel = (u) => (u.role === 'coach' ? 'مربی' : 'ورزشکار');

export function SwitchProfileModal() {
  const { db, user, changeUser, openModal, closeModal } = useApp();
  return (
    <Sheet title="تغییر پروفایل">
      {db.users.map((u) => (
        <button
          key={u.id}
          className={`select-user-row ${u.id === user.id ? 'current-user' : ''}`}
          onClick={() => {
            changeUser(u.id);
            closeModal();
          }}
        >
          <span className="avatar">{u.name[0]}</span>
          <span>
            <b>{u.name}</b>
            <small>
              {roleLabel(u)} · {u.goal}
            </small>
          </span>
          {u.id === user.id ? <Check size={18} /> : <ChevronLeft size={17} />}
        </button>
      ))}
      <button className="btn ghost wide" onClick={() => openModal({ type: 'signup' })}>
        <Plus size={16} /> ساخت حساب جدید
      </button>
      <p className="modal-footnote">پروفایل‌ها نمونه‌های محلی هستند و ورود امن یا حساب‌های واقعی محسوب نمی‌شوند.</p>
    </Sheet>
  );
}

const ROLES = [
  ['athlete', 'ورزشکار', 'برنامه می‌گیرم و تمرین می‌کنم'],
  ['coach', 'مربی', 'برنامه می‌نویسم و شاگرد مدیریت می‌کنم'],
];

export function SignupModal() {
  const { signUp } = useApp();
  const [form, setForm] = useState({ name: '', role: 'athlete', goal: GOALS[1], level: LEVELS[0], height: '', weight: '' });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isAthlete = form.role === 'athlete';

  const submit = () => (form.name.trim() ? signUp(form) : alert('نام را وارد کن'));

  return (
    <Sheet title="ساخت حساب جدید">
      <Field label="نام" value={form.name} onChange={set('name')} />
      <div className="role-pick">
        {ROLES.map(([id, title, hint]) => (
          <button key={id} className={form.role === id ? 'selected' : ''} onClick={() => set('role')(id)}>
            <b>{title}</b>
            <small>{hint}</small>
          </button>
        ))}
      </div>
      {isAthlete && (
        <>
          <SelectField label="هدف تمرینی" value={form.goal} onChange={set('goal')} options={GOALS} />
          <SelectField label="سطح تجربه" value={form.level} onChange={set('level')} options={LEVELS} />
          <div className="form-grid">
            <Field label="قد (سانتی‌متر)" type="number" value={form.height} onChange={set('height')} />
            <Field label="وزن (کیلوگرم)" type="number" value={form.weight} onChange={set('weight')} />
          </div>
        </>
      )}
      <button className="btn wide" onClick={submit}>
        <Plus size={17} /> ساخت حساب و دریافت شناسه
      </button>
    </Sheet>
  );
}

export function NotificationsModal() {
  const { db, user, update, closeModal } = useApp();
  const notes = getNotifications(db, user.id);

  const markAllRead = () => {
    update((d) => ({ notifications: d.notifications.map((n) => (n.userId && n.userId !== user.id ? n : { ...n, read: true })) }));
    closeModal();
  };

  return (
    <Sheet title="اعلان‌ها">
      {notes.length ? (
        notes.map((n) => (
          <div className="notification-row" key={n.id}>
            <span className="summary-icon">
              <Bell size={17} />
            </span>
            <div>
              <b>{n.title}</b>
              <p>{n.text}</p>
            </div>
            {!n.read && <span className="unread-dot" />}
          </div>
        ))
      ) : (
        <Empty icon={Bell} title="اعلان تازه‌ای نیست" text="اعلان‌های محلی در این بخش نمایش داده می‌شوند." />
      )}
      <button className="btn ghost wide" onClick={markAllRead}>
        علامت‌گذاری همه به‌عنوان خوانده‌شده
      </button>
    </Sheet>
  );
}

/** Athlete picks a coach; a coach on the free plan can take at most 3 athletes. */
export function ChooseCoachModal() {
  const { db, user, chooseCoach } = useApp();
  const coaches = db.users.filter((u) => u.role === 'coach');

  return (
    <Sheet title="انتخاب مربی">
      <p>مربی‌ات را انتخاب کن تا برنامه تمرینی را برایت ثبت کند.</p>
      {coaches.map((coach) => {
        const count = db.users.filter((u) => u.coachId === coach.id).length;
        const isCurrent = user.coachId === coach.id;
        const isFull = coach.plan !== 'pro' && count >= FREE_ATHLETE_LIMIT && !isCurrent;
        return (
          <button key={coach.id} className={`select-user-row ${isCurrent ? 'current-user' : ''}`} disabled={isFull} onClick={() => chooseCoach(coach)}>
            <span className="avatar">{coach.name[0]}</span>
            <span>
              <b>{coach.name}</b>
              <small>{isFull ? 'ظرفیت این مربی تکمیل است' : `${faNum(count)} شاگرد · ${coach.goal}`}</small>
            </span>
            {isCurrent ? <Check size={18} /> : <ChevronLeft size={17} />}
          </button>
        );
      })}
    </Sheet>
  );
}

export function UpgradeModal() {
  const { upgradePlan } = useApp();
  return (
    <Sheet title="اشتراک مربی">
      <div className="assign-program-preview">
        <span className="summary-icon">
          <Trophy />
        </span>
        <div>
          <b>پلن رایگان: تا {faNum(FREE_ATHLETE_LIMIT)} شاگرد</b>
          <small>برای شاگرد چهارم به بعد، اشتراک مربی لازم است.</small>
        </div>
      </div>
      <p className="modal-description">
        با اشتراک، تعداد شاگردان نامحدود می‌شود. پرداخت واقعی به درگاه و بک‌اند نیاز دارد؛ در این نسخه محلی، دکمه زیر فقط پلن را آزمایشی فعال می‌کند.
      </p>
      <button className="btn wide" onClick={upgradePlan}>
        <Check size={17} /> فعال‌سازی اشتراک (نمایشی)
      </button>
    </Sheet>
  );
}
