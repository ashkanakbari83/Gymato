// Exercise detail: animation, description, how-to steps, safety note and calorie estimate.
import { Check, CircleHelp } from 'lucide-react';
import MoveMedia from '../components/exercise/MoveMedia';
import Sheet from '../components/ui/Sheet';
import { useApp } from '../context/AppContext';
import { describeCalories } from '../lib/calories';

export default function ExerciseModal({ exercise }) {
  const { closeModal } = useApp();
  return (
    <Sheet title="جزئیات حرکت">
      <div className="exercise-detail-art">
        <MoveMedia exercise={exercise} />
      </div>
      <h2 className="detail-title">
        {exercise.fa} <small>{exercise.en}</small>
      </h2>
      <p className="modal-description">{exercise.desc}</p>
      <div className="detail-chips">
        {[exercise.muscle, exercise.equip, exercise.level, describeCalories(exercise)].filter(Boolean).map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      <h3>روش اجرا</h3>
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
        <Check size={17} /> متوجه شدم
      </button>
    </Sheet>
  );
}
