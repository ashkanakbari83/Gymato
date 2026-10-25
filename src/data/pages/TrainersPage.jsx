// Trainer discovery: search plus location / specialty filters.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import TrainerCard from '../components/marketplace/TrainerCard.jsx';
import Empty from '../components/ui/Empty.jsx';
import { SelectField } from '../components/ui/Field.jsx';
import LocationFields from '../components/ui/LocationFields.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FOCUS_AREAS } from '../lib/constants.js';
import { filterTrainers } from '../lib/marketplace.js';

const NO_FILTERS = { query: '', province: '', city: '', focus: '', coachingOnly: false };

export default function TrainersPage() {
  const { db, go, t } = useApp();
  const [filters, setFilters] = useState(NO_FILTERS);
  const trainers = useMemo(() => filterTrainers(db, filters), [db, filters]);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <section className="stack">
      <div className="search-box">
        <Search size={18} />
        <input value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder={t('trainers.search')} />
      </div>

      <div className="panel filters">
        <div className="form-grid">
          <LocationFields province={filters.province} city={filters.city} emptyLabel={t('common.all')} onChange={set} />
          <SelectField
            label={t('trainers.specialty')}
            value={filters.focus}
            onChange={(focus) => set({ focus })}
            options={[{ value: '', label: t('common.all') }, ...FOCUS_AREAS.map((id) => ({ value: id, label: t(`focus.${id}`) }))]}
          />
        </div>
        <label className="check-row">
          <input type="checkbox" checked={filters.coachingOnly} onChange={(e) => set({ coachingOnly: e.target.checked })} />
          {t('trainers.coachingOnly')}
        </label>
      </div>

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
