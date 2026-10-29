// Athlete food and water log.
import { addFoodEntry, removeFoodEntry, setWater } from '../lib/domain/nutrition.js';
import { logMealFor, mealLabel } from '../lib/mealPlan.js';

export function useNutritionActions({ user, notify, t, dispatch }) {
  /** Logs a food (see addFoodEntry for the input). Returns the domain result so forms can show field errors. */
  const addFood = (input) => {
    const result = dispatch(addFoodEntry, user.id, input);
    if (result.ok) notify(t('food.added'));
    return result;
  };

  const removeFood = (entryId) => dispatch(removeFoodEntry, user.id, entryId);

  const setGlasses = (date, glasses) => dispatch(setWater, user.id, date, glasses);

  /** One tap from a trainer's meal plan into today's log (only meals that carry an approximate energy amount). */
  const logPlannedMeal = (meal, date) => {
    const label = mealLabel(meal, t);
    const first = meal.text.split('\n')[0].slice(0, 50);
    const result = dispatch(addFoodEntry, user.id, { date, meal: logMealFor(meal.slot), name: `${label}: ${first}`, kcal: meal.kcal });
    if (result.ok) notify(t('meal.logged'));
    return result;
  };

  return { addFood, removeFood, setGlasses, logPlannedMeal };
}
