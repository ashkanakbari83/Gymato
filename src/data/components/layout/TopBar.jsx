// Desktop top bar: brand, page tabs, notifications, settings and the account menu.
import { Activity, Bell, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getNotifications } from '../../lib/selectors.js';
import { getNavItems, navTabFor } from './navItems.js';

export default function TopBar() {
  const { db, user, isTrainer, page, setPage, openModal, t } = useApp();
  const hasUnread = getNotifications(db, user.id).some((n) => !n.read);

  return (
    <header className="topbar">
      <div className="topbar-in">
        <button className="brand" onClick={() => setPage('home')}>
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          {t('app.name')}
        </button>

        <nav className="tabs" aria-label={t('nav.pages')}>
          {getNavItems(isTrainer).map(({ id }) => (
            <button key={id} className={navTabFor(page) === id ? 'active' : ''} onClick={() => setPage(id)}>
              {t(`nav.${id}`)}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button className="icon-btn" aria-label={t('nav.notifications')} onClick={() => openModal({ type: 'notifications' })}>
            <Bell size={20} />
            {hasUnread && <i className="dot" />}
          </button>
          <button className="icon-btn" aria-label={t('nav.settings')} onClick={() => setPage('settings')}>
            <Settings size={20} />
          </button>
          <button className="avatar-btn" aria-label={t('nav.account')} onClick={() => openModal({ type: 'account' })}>
            {user.name[0]}
          </button>
        </div>
      </div>
    </header>
  );
}
