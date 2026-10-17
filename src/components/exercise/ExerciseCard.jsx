// Library card: animation, name, muscle group and favourite toggle.
import { Heart } from 'lucide-react';
import Stickman from './Stickman';

export default function ExerciseCard({ exercise, favorite, onToggleFavorite, onOpen }) {
  return (
    <article className="ex-card">
      <button className="ex-media" onClick={onOpen} aria-label={`جزئیات ${exercise.fa}`}>
        <Stickman id={exercise.id} />
      </button>
      <div className="ex-body">
        <button className="ex-name" onClick={onOpen}>
          <b>{exercise.fa}</b>
          <small>{exercise.muscle}</small>
        </button>
        <button className={`fav ${favorite ? 'on' : ''}`} onClick={onToggleFavorite} aria-label="علاقه‌مندی">
          <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  );
}
