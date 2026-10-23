// Account sheets: account menu (profile + demo account switcher), sign-up and notifications.
import { Bell, Check, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import Empty from '../components/ui/Empty.jsx';
import { ChipSelect, Field, SelectField } from '../components/ui/Field.jsx';
import LocationFields from '../components/ui/LocationFields.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { GOALS, LEVELS } from '../lib/constants.js';
import { formatDateTime } from '../lib/format.js';
import { getNotifications } from '../lib/selectors.js';

export function AccountMenuModal() {
  const { db, user, changeUser, go, openModal, closeModal, t } = useApp();
  return (
    <Sheet title={t('acct.title')}>
      <div className="assign-program-preview">
        <span className="avatar">{user.name[0]}</span>
        <div>
          <b>{user.name}</b>
          <small>
            {t(user.role === 'coach' ? 'role.coach' : 'role.athlete')} · {user.publicId}
          </small>
        </div>
      </div>
      <button className="btn wide" onClick={() => { closeModal(); go('profile'); }}>
        <UserRound size={16} /> {t('acct.profile')}
      </button>

      <p className="modal-description sep">{t('acct.switchDemo')}</p>
      {db.users.map((u) => (
        <button key={u.id} className={`select-user-row ${u.id === user.id ? 'current-user' : ''}`} onClick={() => { changeUser(u.id); closeModal(); }}>
          <span className="avatar">{u.name[0]}</span>
          <span>
            <b>{u.name}</b>
            <small>{t(u.role === 'coach' ? 'role.coach' : 'role.athlete')}</small>
          </span>
          {u.id === user.id ? <Check size={18} /> : <ArrowForward size={17} />}
        </button>
      ))}
      <button className="btn ghost wide" onClick={() => openModal({ type: 'signup' })}>
        <Plus size={16} /> {t('acct.newAccount')}
      </button>
      <p className="modal-footnote">{t('acct.demoNote')}</p>
    </Sheet>
  );
}

export function SignupModal() {
  const { signUp, t } = useApp();
  const [form, setForm] = useState({ name: '', role: 'athlete', province: '', city: '', age: '', height: '', weight: '', goal: GOALS[0], level: LEVELS[0] });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const isAthlete = form.role === 'athlete';

  return (
    <Sheet title={t('acct.signupTitle')}>
      <Field label={t('cr.name')} value={form.name} onChange={set('name')} />
      <ChipSelect label={t('acct.role')} value={form.role} onChange={set('role')} options={[{ value: 'athlete', label: t('role.athlete') }, { value: 'coach', label: t('role.coach') }]} />
      <div className="form-grid">
        <LocationFields province={form.province} city={form.city} emptyLabel={t('common.notSet')} onChange={(loc) => setForm((f) => ({ ...f, ...loc }))} />
      </div>
      {isAthlete && (
        <>
          <SelectField label={t('cr.goal')} value={form.goal} onChange={set('goal')} options={GOALS.map((id) => ({ value: id, label: t(`goal.${id}`) }))} />
          <SelectField label={t('cr.level')} value={form.level} onChange={set('level')} options={LEVELS.map((id) => ({ value: id, label: t(`level.${id}`) }))} />
          <div className="form-grid">
            <Field label={t('cr.age')} type="number" value={form.age} onChange={set('age')} />
            <Field label={t('body.heightCm')} type="number" value={form.height} onChange={set('height')} />
            <Field label={t('body.weightKg')} type="number" value={form.weight} onChange={set('weight')} />
          </div>
        </>
      )}
      <button className="btn wide" onClick={() => (form.name.trim() ? signUp(form) : alert(t('acct.nameRequired')))}>
        <Plus size={17} /> {t('acct.create')}
      </button>
    </Sheet>
  );
}

export function NotificationsModal() {
  const { db, user, markNotificationsRead, openTarget, t } = useApp();
  const notes = getNotifications(db, user.id);

  return (
    <Sheet title={t('nav.notifications')}>
      {notes.length ? (
        notes.map((n) => (
          <button className="notification-row" key={n.id} onClick={() => openTarget(n.target)}>
            <span className="summary-icon">
              <Bell size={17} />
            </span>
            <div>
              <b>{t(`notif.${n.type}.title`, n.params)}</b>
              <p>{t(`notif.${n.type}.text`, n.params)}</p>
              <small>{formatDateTime(n.createdAt)}</small>
            </div>
            {!n.read && <span className="unread-dot" />}
          </button>
        ))
      ) : (
        <Empty icon={Bell} title={t('notif.emptyTitle')} text={t('notif.emptyText')} />
      )}
      {notes.length > 0 && (
        <button className="btn ghost wide" onClick={markNotificationsRead}>
          {t('notif.markRead')}
        </button>
      )}
    </Sheet>
  );
}
