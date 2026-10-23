// Exercise detail: animation, description, how-to steps, safety note and calorie estimate.
// Descriptions and steps are written in Persian only; names and labels follow the UI language.
import { Check, CircleHelp } from 'lucide-react';
import MoveMedia from '../components/exercise/MoveMedia.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { describeCalories } from '../lib/calories.js';

export default function ExerciseModal({ exercise }) {
  const { closeModal, lang, t } = useApp();
  const chips = [t(`cat.${exercise.cat}`), describeCalories(exercise, t)].filter(Boolean);

  return (
    <Sheet title={t('ex.detail')}>
      <div className="exercise-detail-art">
        <MoveMedia exercise={exercise} />
      </div>
      <h2 className="detail-title">
        {lang === 'fa' ? exercise.fa : exercise.en} <small>{lang === 'fa' ? exercise.en : exercise.fa}</small>
      </h2>
      <p className="modal-description">{exercise.desc}</p>
      <div className="detail-chips">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <h3>{t('ex.howTo')}</h3>
      <ol className="instruction-list">
        {exercise.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="safety-note">
        <CircleHelp size={17} />
        <p>{exercise.safety}</p>
      </div>
      <button className="btn wide" onClick={closeModal}>
        <Check size={17} /> {t('common.gotIt')}
      </button>
    </Sheet>
  );
}
