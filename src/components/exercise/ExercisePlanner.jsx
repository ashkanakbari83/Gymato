// Pick exercises from the bank and set sets / reps / rest for each. Works on a `draft`
// ({ exercises: ids[], targets: { [id]: { sets, reps, rest } } }), so it is shared by the general-program,
// custom-program and deck editors. Pass `decks` to show quick-add chips.
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { num } from '../../lib/format.js';
import { defaultTarget } from '../../lib/programs.js';
import { exerciseName } from '../../lib/selectors.js';

const TARGET_FIELDS = [
  { key: 'sets', label: () => 'plan.sets' },
  { key: 'reps', label: (e) => (e.type === 'duration' ? 'common.seconds' : 'common.reps') },
  { key: 'rest', label: () => 'plan.rest', min: 0 },
];

export default function ExercisePlanner({ exercises, draft, setDraft, decks = [], error, targetErrors = {} }) {
  const { lang, t } = useApp();
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
          <small>{t('plan.quickAdd')}</small>
          {decks.map((deck) => (
            <button key={deck.id} type="button" onClick={() => addDeck(deck)}>
              <Plus size={13} />
              {deck.name}
            </button>
          ))}
        </div>
      )}

      <div className="modal-subtitle" data-field="exercises">
        <b>{t('plan.title')}</b>
        <small>{t('plan.selected', { n: num(selected.length) })}</small>
      </div>
      {error && <small className="field-error" id="exercises-error">{error}</small>}

      <div className={`exercise-picker ${error ? 'invalid' : ''}`} aria-describedby={error ? 'exercises-error' : undefined}>
        {exercises.map((exercise) => {
          const on = selected.includes(exercise.id);
          const target = targets[exercise.id] ?? {};
          const bad = (key) => Boolean(targetErrors[`target.${exercise.id}.${key}`]);
          const anyBad = on && TARGET_FIELDS.some(({ key }) => bad(key));
          return (
            <div key={exercise.id} className={`picker-item ${on ? 'on' : ''} ${anyBad ? 'invalid' : ''}`}>
              <label className="picker-row">
                <input type="checkbox" checked={on} onChange={(e) => toggle(exercise, e.target.checked)} />
                <span>
                  <b>{exerciseName(exercise, lang)}</b>
                  <small>{t(`cat.${exercise.cat}`, {})}</small>
                </span>
              </label>
              {on && (
                <div className="target-inputs">
                  {TARGET_FIELDS.map(({ key, label, min = 1 }) => (
                    <label key={key} data-field={`target.${exercise.id}.${key}`} className={bad(key) ? 'invalid' : ''}>
                      {t(label(exercise))}
                      <input type="number" min={min} value={target[key] ?? ''} aria-invalid={bad(key) || undefined} onChange={(e) => setTarget(exercise.id, key, e.target.value)} />
                    </label>
                  ))}
                  {anyBad && <small className="field-error target-error">{t('plan.targetInvalid')}</small>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
