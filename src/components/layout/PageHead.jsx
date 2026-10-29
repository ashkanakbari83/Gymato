// Page title (with today's date on home) and the trainer's "new program" shortcut.
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatToday } from '../../lib/format.js';
import { ArrowBack } from '../ui/Arrow.jsx';
import { getPageTitle } from './navItems.js';

export default function PageHead() {
  const { page, user, isTrainer, openGeneralEditor, go, t } = useApp();
  if (page === 'player' || page === 'trainer') return null; // the trainer profile draws its own header

  return (
    <div className="page-head">
      <div>
        <h1>{getPageTitle(page, user, isTrainer, t)}</h1>
        {page === 'home' && <p className="page-date">{formatToday()}</p>}
      </div>
      {isTrainer && page === 'programs' && (
        <button className="btn" onClick={() => openGeneralEditor()}>
          <Plus size={18} /> {t('programs.newGeneral')}
        </button>
      )}
      {(page === 'settings' || page === 'nutrition') && (
        <button className="btn ghost" onClick={() => go('home')}>
          <ArrowBack size={16} /> {t('common.back')}
        </button>
      )}
    </div>
  );
}
