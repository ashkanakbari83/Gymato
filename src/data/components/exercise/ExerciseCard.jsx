// Library card: animation, name, muscle group and favourite toggle.
import { Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { exerciseName } from '../../lib/selectors.js';
import Stickman from './Stickman.jsx';

export default function ExerciseCard({ exercise, favorite, onToggleFavorite, onOpen }) {
  const { lang, t } = useApp();
  const name = exerciseName(exercise, lang);
  return (
    <article className="ex-card">
      <button className="ex-media" onClick={onOpen} aria-label={t('ex.detailOf', { name })}>
        <Stickman id={exercise.id} />
      </button>
      <div className="ex-body">
        <button className="ex-name" onClick={onOpen}>
          <b>{name}</b>
          <small>{lang === 'fa' ? exercise.muscle : t(`cat.${exercise.cat}`)}</small>
        </button>
        <button className={`fav ${favorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-label={t('ex.favorite')}>
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}
