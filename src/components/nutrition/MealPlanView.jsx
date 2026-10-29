// The trainer's meal plan as the athlete sees it. Meals that carry an approximate energy amount can be
// logged into today's food log with one tap.
import { Plus, Utensils } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { dayKey } from '../../lib/domain/nutrition.js';
import { num } from '../../lib/format.js';
import { mealLabel } from '../../lib/mealPlan.js';

export default function MealPlanView({ plan, canLog = false }) {
  const { t, logPlannedMeal } = useApp();
  if (!plan) return null;

  return (
    <section className="co-section meal-view">
      <h3><Utensils size={17} /> {t('meal.viewTitle')}</h3>
      <ul className="meal-list">
        {plan.meals.map((meal) => (
          <li key={meal.id}>
            <div className="meal-line-head">
              <b>{mealLabel(meal, t)}</b>
              {meal.kcal > 0 && <span className="muted">{t('meal.approxKcal', { n: num(meal.kcal) })}</span>}
            </div>
            <p>{meal.text}</p>
            {canLog && meal.kcal > 0 && (
              <button type="button" className="btn ghost sm" onClick={() => logPlannedMeal(meal, dayKey())}>
                <Plus size={14} /> {t('meal.logToday')}
              </button>
            )}
          </li>
        ))}
      </ul>
      {plan.note && <p className="note-box">{plan.note}</p>}
      <p className="muted small">{t('meal.disclaimer')}</p>
    </section>
  );
}
