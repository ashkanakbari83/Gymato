import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatToday } from '../../lib/format';
import { getPageTitle } from './navItems';

/** Page title (with today's date on the home page) and the coach's "new program" shortcut. */
export default function PageHead() {
  const { page, user, isCoach, openProgramForm } = useApp();
  if (page === 'player') return null;

  const canCreateProgram = isCoach && (page === 'home' || page === 'programs');
  return (
    <div className="page-head">
      <div>
        <h1>{getPageTitle(page, user, isCoach)}</h1>
        {page === 'home' && <p className="page-date">{formatToday()}</p>}
      </div>
      {canCreateProgram && (
        <button className="btn" onClick={() => openProgramForm()}>
          <Plus size={18} /> برنامه
        </button>
      )}
    </div>
  );
}
