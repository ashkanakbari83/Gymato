// Exercise library with search and category chips.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ExerciseCard from '../components/exercise/ExerciseCard.jsx';
import Empty from '../components/ui/Empty.jsx';
import { useApp } from '../context/AppContext.jsx';
import { num } from '../lib/format.js';
import { filterExercises } from '../lib/selectors.js';

export default function ExercisesPage() {
  const { db, update, openModal, t } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(() => [...new Set(db.exercises.map((e) => e.cat))], [db.exercises]);
  const visible = useMemo(() => filterExercises(db.exercises, query, category), [db.exercises, query, category]);

  const toggleFavorite = (id) =>
    update((d) => ({ favorites: d.favorites.includes(id) ? d.favorites.filter((x) => x !== id) : [...d.favorites, id] }));

  const clear = () => {
    setQuery('');
    setCategory('');
  };

  return (
    <section className="stack">
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('ex.search')} aria-label={t('ex.search')} />
      </div>

      <div className="chips">
        {['', ...categories].map((value) => (
          <button key={value} className={category === value ? 'on' : ''} onClick={() => setCategory(value)}>
            {value ? t(`cat.${value}`) : t('common.all')}
          </button>
        ))}
      </div>

      {/* Browsing everything: grouped by type, so the eye has headings to land on. A search or a chosen chip shows a plain list. */}
      {(category || query ? [[null, visible]] : categories.map((cat) => [cat, visible.filter((e) => e.cat === cat)]).filter(([, list]) => list.length)).map(([cat, list]) => (
        <div className="ex-group" key={cat ?? 'all'}>
          {cat && <h2 className="ex-group-title">{t('ex.group', { name: t(`cat.${cat}`), n: num(list.length) })}</h2>}
          <div className="ex-grid">
            {list.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} favorite={db.favorites.includes(exercise.id)} onToggleFavorite={() => toggleFavorite(exercise.id)} onOpen={() => openModal({ type: 'exercise', exercise })} />
            ))}
          </div>
        </div>
      ))}

      {!visible.length && <Empty icon={Search} title={t('ex.emptyTitle')} text={t('ex.emptyText')} actionLabel={t('common.clear')} onAction={clear} />}
    </section>
  );
}
