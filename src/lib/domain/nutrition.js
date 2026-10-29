// Food and water log. Pure like the other domain functions: (db, ...args) => { ok, db } | { ok: false, error }.
// Each logged item stores a snapshot of its numbers, so later edits to the food list never change history.
import { getFood } from '../../data/foods.js';
import { uid } from '../format.js';
import { byId, fail, nowIso, ok } from './shared.js';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MAX_SERVINGS = 20;
export const MAX_CUSTOM_KCAL = 5000;
export const GLASS_ML = 250;
export const MAX_GLASSES = 30;

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD (not UTC: a late-night meal belongs to the day the person is living). */
export const dayKey = (ms = Date.now()) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** The day before/after `key`, as a key. Works on the calendar (DST-safe), not on 24-hour steps. */
export function shiftDay(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + delta, 12).getTime());
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Rough daily energy target from the profile (Mifflin-St Jeor, averaged over sexes since the profile has
 * no sex field, times a light-activity factor). Deliberately gentle: at most about 10% under or 8% over
 * maintenance and never below 1400. It is an estimate for orientation, not a prescription.
 * Returns null when age, height or weight is missing.
 */
export function dailyTarget(user) {
  const age = Number(user?.age);
  const height = Number(user?.height);
  const weight = Number(user?.weight);
  if (!(age > 0 && height > 0 && weight > 0)) return null;
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78;
  const maintenance = bmr * 1.5;
  const factor = user.goal === 'fatloss' ? 0.9 : user.goal === 'muscle' ? 1.08 : 1;
  const kcal = Math.min(4000, Math.max(1400, Math.round((maintenance * factor) / 50) * 50));
  return { kcal };
}

/** Daily water goal in glasses of 250 ml: about 33 ml per kg, kept between 6 and 14. */
export function waterGoal(user) {
  const weight = Number(user?.weight);
  if (!(weight > 0)) return 8;
  return Math.min(14, Math.max(6, Math.round((weight * 33) / GLASS_ML)));
}

/** Items one person logged on one day. */
export const entriesFor = (db, userId, date) => db.foodLog.filter((e) => e.userId === userId && e.date === date);

/** Energy and macros of a list of items. */
export function totalsOf(entries) {
  const sum = (key) => round1(entries.reduce((total, e) => total + (e[key] || 0), 0));
  return { kcal: Math.round(sum('kcal')), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat'), count: entries.length };
}

export const totalsFor = (db, userId, date) => totalsOf(entriesFor(db, userId, date));

/** Glasses of water drunk on a day. */
export const waterFor = (db, userId, date) => db.waterLog.find((w) => w.userId === userId && w.date === date)?.glasses ?? 0;

/** [{ date, kcal, glasses }] for the `days` days ending at `endDate` (oldest first), for the small weekly chart. */
export function recentDays(db, userId, endDate, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const date = shiftDay(endDate, i - (days - 1));
    return { date, kcal: totalsFor(db, userId, date).kcal, glasses: waterFor(db, userId, date) };
  });
}

/** The foods this person logged most recently (distinct, newest first) — one tap to log them again. */
export function recentFoodIds(db, userId, limit = 6) {
  const seen = [];
  for (const entry of [...db.foodLog].filter((e) => e.userId === userId && e.foodId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
    if (!seen.includes(entry.foodId)) seen.push(entry.foodId);
    if (seen.length >= limit) break;
  }
  return seen;
}

/**
 * Logs a food. `input`: { date, meal, servings, foodId } for a listed food, or { date, meal, name, kcal,
 * [protein, carbs, fat] } for one the person typed (kcal is for the whole amount). Field errors:
 * required | invalid.
 */
export function addFoodEntry(db, userId, input, now = Date.now()) {
  const user = byId(db.users, userId);
  if (!user) return fail('forbidden');
  const errors = {};
  const meal = MEAL_TYPES.includes(input.meal) ? input.meal : 'snack';
  const servings = input.foodId ? Number(input.servings ?? 1) : 1;
  const food = input.foodId ? getFood(input.foodId) : null;
  if (input.foodId && !food) return fail('not_found');
  if (food && !(servings > 0 && servings <= MAX_SERVINGS)) errors.servings = 'invalid';

  let entry;
  if (food) {
    entry = {
      foodId: food.id,
      name: null, // listed foods are named from the food list, in the current language
      servings,
      kcal: Math.round(food.kcal * servings),
      protein: round1(food.protein * servings),
      carbs: round1(food.carbs * servings),
      fat: round1(food.fat * servings),
    };
  } else {
    const name = String(input.name ?? '').trim();
    const kcal = Number(input.kcal);
    if (!name) errors.name = 'required';
    else if (name.length > 80) errors.name = 'invalid';
    if (input.kcal === '' || input.kcal == null) errors.kcal = 'required';
    else if (!(kcal >= 0 && kcal <= MAX_CUSTOM_KCAL)) errors.kcal = 'invalid';
    const macro = (key) => (Number(input[key]) > 0 ? round1(Math.min(Number(input[key]), 1000)) : 0);
    entry = { foodId: null, name, servings: 1, kcal: Math.round(kcal || 0), protein: macro('protein'), carbs: macro('carbs'), fat: macro('fat') };
  }
  if (Object.keys(errors).length) return fail('validation', errors);

  const row = { id: uid(), userId, date: input.date || dayKey(now), meal, ...entry, createdAt: nowIso(now) };
  return ok({ ...db, foodLog: [row, ...db.foodLog] }, { entry: row });
}

/** Removes one of the person's own items. */
export function removeFoodEntry(db, userId, entryId) {
  const entry = byId(db.foodLog, entryId);
  if (!entry || entry.userId !== userId) return fail('not_found');
  return ok({ ...db, foodLog: db.foodLog.filter((e) => e.id !== entryId) });
}

/** Changes the servings of a listed food that was already logged. */
export function setEntryServings(db, userId, entryId, servings) {
  const entry = byId(db.foodLog, entryId);
  if (!entry || entry.userId !== userId) return fail('not_found');
  const food = entry.foodId ? getFood(entry.foodId) : null;
  if (!food) return fail('invalid');
  const amount = Number(servings);
  if (!(amount > 0 && amount <= MAX_SERVINGS)) return fail('invalid');
  const next = {
    ...entry,
    servings: amount,
    kcal: Math.round(food.kcal * amount),
    protein: round1(food.protein * amount),
    carbs: round1(food.carbs * amount),
    fat: round1(food.fat * amount),
  };
  return ok({ ...db, foodLog: db.foodLog.map((e) => (e.id === entryId ? next : e)) });
}

/** Sets the glasses of water for a day (0..30). */
export function setWater(db, userId, date, glasses) {
  if (!byId(db.users, userId)) return fail('forbidden');
  const value = Math.max(0, Math.min(MAX_GLASSES, Math.round(Number(glasses) || 0)));
  const others = db.waterLog.filter((w) => !(w.userId === userId && w.date === date));
  return ok({ ...db, waterLog: value ? [...others, { userId, date, glasses: value }] : others });
}
