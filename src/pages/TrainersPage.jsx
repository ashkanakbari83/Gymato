// Trainer discovery: search plus location / specialty filters.
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import TrainerCard from '../components/marketplace/TrainerCard.jsx';
import Empty from '../components/ui/Empty.jsx';
import LocationFields from '../components/ui/LocationFields.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FOCUS_AREAS } from '../lib/constants.js';
import { num } from '../lib/format.js';
import { filterTrainers } from '../lib/marketplace.js';

const NO_FILTERS = { query: '', province: '', city: '', focus: '', coachingOnly: false };

export default function TrainersPage() {
  const { db, go, t } = useApp();
  const [filters, setFilters] = useState(NO_FILTERS);
  const trainers = useMemo(() => filterTrainers(db, filters), [db, filters]);
  const [open, setOpen] = useState(false);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  // The extra filters stay folded away; the button says how many of them are on, so nothing hides silently.
  const extra = [filters.province, filters.city, filters.coachingOnly].filter(Boolean).length;

  return (
    <section className="stack">
      <div className="search-row">
        <div className="search-box">
          <Search size={18} />
          <input value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder={t('trainers.search')} aria-label={t('trainers.search')} />
        </div>
        <button className={`filter-btn ${open || extra ? 'on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={t('trainers.moreFilters')}>
          <SlidersHorizontal size={18} />
          {extra > 0 && <i>{num(extra)}</i>}
        </button>
      </div>

      <div className="chips" role="group" aria-label={t('trainers.specialty')}>
        {['', ...FOCUS_AREAS].map((id) => (
          <button key={id} className={filters.focus === id ? 'on' : ''} onClick={() => set({ focus: id })}>
            {id ? t(`focus.${id}`) : t('common.all')}
          </button>
        ))}
      </div>

      {open && (
        <div className="panel filters">
          <div className="form-grid">
            <LocationFields province={filters.province} city={filters.city} emptyLabel={t('common.all')} onChange={set} />
          </div>
          <label className="check-row">
            <input type="checkbox" checked={filters.coachingOnly} onChange={(e) => set({ coachingOnly: e.target.checked })} />
            {t('trainers.coachingOnly')}
          </label>
        </div>
      )}

      <div className="grid-cards">
        {trainers.map((trainer) => (
          <TrainerCard key={trainer.id} trainer={trainer} onOpen={() => go('trainer', { trainerId: trainer.id })} />
        ))}
      </div>

      {!trainers.length && (
        <Empty icon={Search} title={t('trainers.emptyTitle')} text={t('trainers.emptyText')} actionLabel={t('common.clearFilters')} onAction={() => setFilters(NO_FILTERS)} />
      )}
    </section>
  );
}
