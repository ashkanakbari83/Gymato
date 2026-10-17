// Mobile tab bar (hidden on desktop via CSS).
import { useApp } from '../../context/AppContext';
import { getNavItems } from './navItems';

/** Mobile tab bar (hidden on desktop via CSS). */
export default function BottomNav() {
  const { isCoach, page, setPage } = useApp();
  if (page === 'player') return null;

  return (
    <nav className="dock" aria-label="صفحه‌ها">
      {getNavItems(isCoach).map(({ id, label, icon: Icon }) => (
        <button key={id} className={page === id ? 'active' : ''} onClick={() => setPage(id)}>
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
