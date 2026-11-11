// Mobile tab bar (hidden on desktop via CSS).
import { useApp } from '../../context/AppContext.jsx';
import { getDockItems, navTabFor } from './navItems.js';

export default function BottomNav() {
  const { isTrainer, page, setPage, t } = useApp();
  if (page === 'player') return null;

  return (
    <nav className="dock" aria-label={t('nav.pages')}>
      {getDockItems(isTrainer).map(({ id, icon: Icon }) => (
        <button key={id} className={navTabFor(page) === id ? 'active' : ''} aria-current={navTabFor(page) === id ? 'page' : undefined} onClick={() => setPage(id)}>
          <Icon size={22} />
          <span>{t(`nav.${id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
