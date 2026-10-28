// Account sheets: account menu (profile, admin account switcher, sign out) and notifications.
import { Bell, Check, LogOut, UserRound } from 'lucide-react';
import Empty from '../components/ui/Empty.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { hasAccount } from '../lib/auth.js';
import { formatDateTime } from '../lib/format.js';
import { getNotifications } from '../lib/selectors.js';

export function AccountMenuModal() {
  const { db, user, changeUser, logout, go, closeModal, t } = useApp();
  const accounts = db.users.filter(hasAccount);
  return (
    <Sheet title={t('acct.title')}>
      <div className="assign-program-preview">
        <span className="avatar">{user.name[0]}</span>
        <div>
          <b>{user.name}</b>
          <small>
            {t(user.role === 'coach' ? 'role.coach' : 'role.athlete')}
            {user.isAdmin && ` · ${t('acct.admin')}`} · {user.publicId}
          </small>
        </div>
      </div>
      <button className="btn wide" onClick={() => { closeModal(); go('profile'); }}>
        <UserRound size={16} /> {t('acct.profile')}
      </button>

      {user.isAdmin && (
        <>
          <p className="modal-description sep">{t('acct.switchAdmin')}</p>
          <div className="list">
            {accounts.map((u) => (
              <button key={u.id} className={`select-user-row ${u.id === user.id ? 'current-user' : ''}`} onClick={() => { changeUser(u.id); closeModal(); }}>
                <span className="avatar">{u.name[0]}</span>
                <span>
                  <b>{u.name}</b>
                  <small>{t(u.role === 'coach' ? 'role.coach' : 'role.athlete')}</small>
                </span>
                {u.id === user.id ? <Check size={18} /> : <ArrowForward size={17} />}
              </button>
            ))}
          </div>
        </>
      )}
      <button className="btn ghost wide" onClick={logout}>
        <LogOut size={16} /> {t('acct.logout')}
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
        <div className="list">
        {notes.map((n) => (
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
        ))}
        </div>
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
