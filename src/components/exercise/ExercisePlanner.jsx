import { Plus } from 'lucide-react';
import { faNum } from '../../lib/format';
import { defaultTarget } from '../../lib/programs';

const TARGET_FIELDS = [
  { key: 'sets', label: () => 'ست' },
  { key: 'reps', label: (e) => (e.type === 'duration' ? 'ثانیه' : 'تکرار') },
  { key: 'rest', label: () => 'استراحت (ث)', min: 0 },
];

/**
 * Pick exercises from the bank and set sets / reps / rest for each.
 * Works on a `draft` ({ exercises: ids[], targets: { [id]: {sets,reps,rest} } }) so it
 * can be shared by the program and deck editors. Pass `decks` to show quick-add chips.
 */
export default function ExercisePlanner({ exercises, draft, setDraft, decks = [] }) {
  const selected = draft.exercises ?? [];
  const targets = draft.targets ?? {};

  const toggle = (exercise, on) =>
    setDraft({
      ...draft,
      exercises: on ? [...selected, exercise.id] : selected.filter((id) => id !== exercise.id),
      targets: on ? { ...targets, [exercise.id]: targets[exercise.id] ?? defaultTarget(exercise) } : targets,
    });

  const setTarget = (id, key, value) =>
    setDraft({ ...draft, targets: { ...targets, [id]: { ...targets[id], [key]: value === '' ? '' : Number(value) } } });

  const addDeck = (deck) => {
    const merged = { ...targets };
    deck.exercises.forEach((id) => {
      const exercise = exercises.find((e) => e.id === id);
      if (exercise) merged[id] = deck.targets?.[id] ?? merged[id] ?? defaultTarget(exercise);
    });
    setDraft({ ...draft, exercises: [...new Set([...selected, ...deck.exercises])], targets: merged });
  };

  return (
    <>
      {decks.length > 0 && (
        <div className="deck-chips">
          <small>افزودن سریع از دک</small>
          {decks.map((deck) => (
            <button key={deck.id} onClick={() => addDeck(deck)}>
              <Plus size={13} />
              {deck.name}
            </button>
          ))}
        </div>
      )}

      <div className="modal-subtitle">
        <b>حرکات و ست‌ها</b>
        <small>{faNum(selected.length)} حرکت انتخاب شده</small>
      </div>

      <div className="exercise-picker">
        {exercises.map((exercise) => {
          const on = selected.includes(exercise.id);
          const target = targets[exercise.id] ?? {};
          return (
            <div key={exercise.id} className={`picker-item ${on ? 'on' : ''}`}>
              <label className="picker-row">
                <input type="checkbox" checked={on} onChange={(e) => toggle(exercise, e.target.checked)} />
                <span>
                  <b>{exercise.fa}</b>
                  <small>
                    {exercise.cat} · {exercise.muscle}
                  </small>
                </span>
              </label>
              {on && (
                <div className="target-inputs">
                  {TARGET_FIELDS.map(({ key, label, min = 1 }) => (
                    <label key={key}>
                      {label(exercise)}
                      <input type="number" min={min} value={target[key] ?? ''} onChange={(e) => setTarget(exercise.id, key, e.target.value)} />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
