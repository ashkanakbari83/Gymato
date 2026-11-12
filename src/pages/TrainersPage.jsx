// Trainer discovery: search plus location / specialty filters.
import { Crown, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import TrainerCard from '../components/marketplace/TrainerCard.jsx';
import Empty from '../components/ui/Empty.jsx';
import LocationFields from '../components/ui/LocationFields.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FOCUS_AREAS } from '../lib/constants.js';
import { num } from '../lib/format.js';
import { filterTrainers } from '../lib/marketplace.js';
import { isPremium, rankTrainers } from '../lib/premium.js';

// The list shows this many trainers at first, then this many more per tap: 100+ cards at once cost real time on slow phones.
const PAGE_SIZE = 24;
const NO_FILTERS = { query: '', province: '', city: '', focus: '', coachingOnly: false, premiumOnly: false };

export default function TrainersPage() {
  const { db, go, pageParams, t } = useApp();
  // A link can open the list already narrowed to a province (the Premium page does).
  const [filters, setFilters] = useState({ ...NO_FILTERS, province: pageParams?.province ?? '', premiumOnly: Boolean(pageParams?.premiumOnly) });
  // Featured (Premium) trainers first as their own labelled group; inside each group the best score first.
  const trainers = useMemo(() => rankTrainers(db, filterTrainers(db, filters)), [db, filters]);
  const [shown, setShown] = useState(PAGE_SIZE);
  // A new search or filter starts again from the top of the list.
  useEffect(() => setShown(PAGE_SIZE), [filters]);
  // Featured first, so paging never cuts a featured trainer off: only the cards that are on screen get built.
  const visible = trainers.slice(0, shown);
  const featured = visible.filter((trainer) => isPremium(trainer));
  const others = visible.filter((trainer) => !isPremium(trainer));
  const [open, setOpen] = useState(Boolean(pageParams?.province));
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  // The extra filters stay folded away; the button says how many of them are on, so nothing hides silently.
  const extra = [filters.province, filters.city, filters.coachingOnly].filter(Boolean).length;

  return (
    <section className="stack">
      <div className="search-row">
        <div className="search-box">
          <Search size={18} />
          <input inputMode="search" enterKeyHint="search" value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder={t('trainers.search')} aria-label={t('trainers.search')} />
        </div>
        <button className={`filter-btn ${open || extra ? 'on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={t('trainers.moreFilters')}>
          <SlidersHorizontal size={18} />
          {extra > 0 && <i>{num(extra)}</i>}
        </button>
      </div>

      <div className="chips" role="group" aria-label={t('trainers.specialty')}>
        <button className={`chip-premium ${filters.premiumOnly ? 'on' : ''}`} aria-pressed={filters.premiumOnly} onClick={() => set({ premiumOnly: !filters.premiumOnly })}>
          <Crown size={13} aria-hidden="true" /> {t('trainers.premiumOnly')}
        </button>
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

      {featured.length > 0 && (
        <>
          <div className="group-head">
            <h2><Crown size={16} aria-hidden="true" /> {t('trainers.premiumGroup')}</h2>
            <p className="muted">{t('trainers.premiumGroupHint')}</p>
          </div>
          <div className="grid-cards">
            {featured.map((trainer) => (
              <TrainerCard key={trainer.id} trainer={trainer} onOpen={() => go('trainer', { trainerId: trainer.id })} />
            ))}
          </div>
        </>
      )}
      {featured.length > 0 && others.length > 0 && (
        <div className="group-head"><h2>{t('trainers.allGroup')}</h2></div>
      )}
      <div className="grid-cards">
        {others.map((trainer) => (
          <TrainerCard key={trainer.id} trainer={trainer} onOpen={() => go('trainer', { trainerId: trainer.id })} />
        ))}
      </div>

      {trainers.length > shown && (
        <button className="btn ghost wide" onClick={() => setShown((n) => n + PAGE_SIZE)}>
          {t('trainers.showMore', { left: num(trainers.length - shown) })}
        </button>
      )}

      {!trainers.length && (
        <Empty icon={Search} title={t('trainers.emptyTitle')} text={t('trainers.emptyText')} actionLabel={t('common.clearFilters')} onAction={() => setFilters(NO_FILTERS)} />
      )}
    </section>
  );
}
