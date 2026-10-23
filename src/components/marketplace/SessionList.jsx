// The workout days of a program with their exercises. Shows "Start" buttons only when the viewer may train.
import { Play } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import { resolveTargets } from '../../lib/programs.js';
import { exerciseName } from '../../lib/selectors.js';

export default function SessionList({ program, canStart = false, onStart }) {
  const { db, lang, t } = useApp();
  return (
    <div className="session-list">
      {program.sessions.map((session, index) => (
        <div className="session" key={index}>
          <div className="session-head">
            <b>{session.name}</b>
            {canStart && (
              <button className="btn" onClick={() => onStart(session)}>
                <Play size={15} fill="currentColor" /> {t('common.start')}
              </button>
            )}
          </div>
          <ul>
            {session.items.map((id) => {
              const exercise = db.exercises.find((e) => e.id === id);
              if (!exercise) return null;
              const target = resolveTargets(program.targets, exercise);
              return (
                <li key={id}>
                  <span>{exerciseName(exercise, lang)}</span>
                  <small>
                    {num(target.sets)} × {num(target.reps)} {t(exercise.type === 'duration' ? 'common.secondsShort' : 'common.repsShort')}
                  </small>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
