// Trainer: build the meal plan that goes with a program. Optional; "remove" takes it off again.
import { Plus, Trash2, Utensils } from 'lucide-react';
import { Field, SelectField, TextArea } from '../ui/Field.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { MAX_MEALS, MAX_MEAL_NOTE, MAX_MEAL_TEXT, MEAL_SLOTS, blankMeal, blankMealPlan } from '../../lib/mealPlan.js';

export default function MealPlanEditor({ value, onChange }) {
  const { t } = useApp();

  if (!value) {
    return (
      <section className="co-section meal-editor is-empty">
        <h3><Utensils size={17} /> {t('meal.editorTitle')}</h3>
        <p className="muted">{t('meal.editorEmpty')}</p>
        <button type="button" className="btn ghost wide" onClick={() => onChange(blankMealPlan())}>
          <Plus size={16} /> {t('meal.add')}
        </button>
      </section>
    );
  }

  const meals = value.meals ?? [];
  const setMeal = (id, patch) => onChange({ ...value, meals: meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const removeMeal = (id) => onChange({ ...value, meals: meals.filter((m) => m.id !== id) });

  return (
    <section className="co-section meal-editor">
      <div className="meal-editor-head">
        <h3><Utensils size={17} /> {t('meal.editorTitle')}</h3>
        <button type="button" className="link danger-link" onClick={() => onChange(null)}>{t('meal.removePlan')}</button>
      </div>
      <p className="muted">{t('meal.editorHelp')}</p>

      {meals.map((meal, index) => (
        <div key={meal.id} className="meal-card">
          <div className="meal-card-top">
            <SelectField
              label={t('meal.slot')}
              value={meal.slot}
              onChange={(slot) => setMeal(meal.id, { slot })}
              options={MEAL_SLOTS.map((slot) => ({ value: slot, label: t(`meal.slot.${slot}`) }))}
            />
            <button type="button" className="icon-btn" onClick={() => removeMeal(meal.id)} aria-label={t('common.remove')}>
              <Trash2 size={17} />
            </button>
          </div>
          {meal.slot === 'custom' && <Field label={t('meal.customTitle')} value={meal.title} maxLength={40} onChange={(title) => setMeal(meal.id, { title })} />}
          <TextArea
            label={t('meal.text')}
            rows={3}
            maxLength={MAX_MEAL_TEXT}
            placeholder={index === 0 ? t('meal.textExample') : undefined}
            value={meal.text}
            onChange={(text) => setMeal(meal.id, { text })}
          />
          <Field label={t('meal.kcal')} type="number" inputMode="numeric" min="0" max="5000" value={meal.kcal} onChange={(kcal) => setMeal(meal.id, { kcal })} hint={t('meal.kcalHint')} />
        </div>
      ))}

      {meals.length < MAX_MEALS && (
        <button type="button" className="btn ghost wide" onClick={() => onChange({ ...value, meals: [...meals, blankMeal('snack')] })}>
          <Plus size={16} /> {t('meal.addMeal')}
        </button>
      )}
      <TextArea label={t('meal.note')} rows={2} maxLength={MAX_MEAL_NOTE} value={value.note} onChange={(note) => onChange({ ...value, note })} />
      <p className="muted small">{t('meal.disclaimer')}</p>
    </section>
  );
}
