// Desktop top bar: brand, page tabs, notifications, settings, profile switcher.
import { Activity, Bell, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getNotifications } from '../../lib/selectors';
import { getNavItems } from './navItems';

export default function TopBar() {
  const { db, user, isCoach, page, setPage, openModal } = useApp();
  const hasUnread = getNotifications(db, user.id).some((n) => !n.read);

  return (
    <header className="topbar">
      <div className="topbar-in">
        <button className="brand" onClick={() => setPage('home')}>
          <span className="brand-mark">
            <Activity size={18} />
          </span>
          جیماتو
        </button>

        <nav className="tabs" aria-label="صفحه‌ها">
          {getNavItems(isCoach).map(({ id, label }) => (
            <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
              {label}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button className="icon-btn" aria-label="اعلان‌ها" onClick={() => openModal({ type: 'notifications' })}>
            <Bell size={20} />
            {hasUnread && <i className="dot" />}
          </button>
          <button className="icon-btn" aria-label="تنظیمات" onClick={() => setPage('settings')}>
            <Settings size={20} />
          </button>
          <button className="avatar-btn" aria-label="تغییر پروفایل" onClick={() => openModal({ type: 'switch' })}>
            {user.name[0]}
          </button>
        </div>
      </div>
    </header>
  );
}
