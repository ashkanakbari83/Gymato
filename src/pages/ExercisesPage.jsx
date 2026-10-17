// Exercise library with search and category chips.
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import ExerciseCard from '../components/exercise/ExerciseCard';
import Empty from '../components/ui/Empty';
import { useApp } from '../context/AppContext';
import { filterExercises } from '../lib/selectors';

const ALL = 'همه';

export default function ExercisesPage() {
  const { db, update, openModal } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(() => [ALL, ...new Set(db.exercises.map((e) => e.cat))], [db.exercises]);
  const visible = useMemo(() => filterExercises(db.exercises, query, category), [db.exercises, query, category]);

  const toggleFavorite = (id) =>
    update((d) => ({ favorites: d.favorites.includes(id) ? d.favorites.filter((x) => x !== id) : [...d.favorites, id] }));

  const clearFilters = () => {
    setQuery('');
    setCategory(ALL);
  };

  return (
    <section className="stack">
      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجوی حرکت یا عضله" />
      </div>

      <div className="chips">
        {categories.map((name) => (
          <button key={name} className={category === name ? 'on' : ''} onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>

      <div className="ex-grid">
        {visible.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            favorite={db.favorites.includes(exercise.id)}
            onToggleFavorite={() => toggleFavorite(exercise.id)}
            onOpen={() => openModal({ type: 'exercise', exercise })}
          />
        ))}
      </div>

      {!visible.length && (
        <Empty icon={Search} title="حرکتی پیدا نشد" text="عبارت دیگری جست‌وجو کن یا دسته را عوض کن." actionLabel="پاک کردن" onAction={clearFilters} />
      )}
    </section>
  );
}
