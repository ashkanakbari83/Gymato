// A trainer's meal plan, attached to a program (general or custom): a few meals in plain text, each
// with an optional approximate energy amount, plus a note. Plain text on purpose — trainers write the way they talk.
import { uid } from './format.js';

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack', 'pre', 'post', 'custom'];
export const MAX_MEALS = 8;
export const MAX_MEAL_TEXT = 600;
export const MAX_MEAL_NOTE = 600;

export const blankMeal = (slot = 'breakfast') => ({ id: uid(), slot, title: '', text: '', kcal: '' });
export const blankMealPlan = () => ({ meals: [blankMeal('breakfast'), blankMeal('lunch'), blankMeal('dinner')], note: '' });

/**
 * What gets stored: empty meals dropped, lengths capped, numbers cleaned. Returns null when there is nothing
 * left (no meals and no note), which is how a trainer removes the plan.
 */
export function sanitizeMealPlan(plan) {
  if (!plan) return null;
  const meals = (plan.meals ?? [])
    .map((meal) => {
      const slot = MEAL_SLOTS.includes(meal.slot) ? meal.slot : 'snack';
      const kcal = Number(meal.kcal);
      return {
        id: meal.id || uid(),
        slot,
        title: slot === 'custom' ? String(meal.title ?? '').trim().slice(0, 40) : '',
        text: String(meal.text ?? '').trim().slice(0, MAX_MEAL_TEXT),
        kcal: kcal > 0 ? Math.min(5000, Math.round(kcal)) : null,
      };
    })
    .filter((meal) => meal.text)
    .slice(0, MAX_MEALS);
  const note = String(plan.note ?? '').trim().slice(0, MAX_MEAL_NOTE);
  return meals.length || note ? { meals, note } : null;
}

/** Display name of a meal: its slot's label, or the trainer's own title for a custom one. `t` translates. */
export const mealLabel = (meal, t) => (meal.slot === 'custom' ? meal.title || t('meal.slot.custom') : t(`meal.slot.${meal.slot}`));

/** The food-log meal a plan meal belongs to (pre/post-workout and custom ones are snacks). */
export const logMealFor = (slot) => (['breakfast', 'lunch', 'dinner'].includes(slot) ? slot : 'snack');
