import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { addFoodEntry, dailyTarget, dayKey, entriesFor, recentDays, recentFoodIds, removeFoodEntry, setEntryServings, setWater, shiftDay, totalsFor, waterFor, waterGoal } from '../domain/nutrition.js';

const db = () => createSeedState();
const NOW = new Date(2026, 9, 29, 10, 0).getTime();

test('days are local calendar days and shift across month/year ends', () => {
  assert.equal(dayKey(new Date(2026, 9, 29, 23, 59).getTime()), '2026-10-29');
  assert.equal(shiftDay('2026-10-31', 1), '2026-11-01');
  assert.equal(shiftDay('2026-01-01', -1), '2025-12-31');
});

test('listed foods are stored with a snapshot of the numbers, scaled by servings', () => {
  const r = addFoodEntry(db(), 'ashkan', { date: '2026-10-29', meal: 'breakfast', foodId: 'egg-boiled', servings: 2 }, NOW);
  assert.ok(r.ok);
  assert.equal(r.entry.kcal, 156);
  assert.equal(r.entry.protein, 12);
  assert.deepEqual(totalsFor(r.db, 'ashkan', '2026-10-29'), { kcal: 156, protein: 12, carbs: 2, fat: 10, count: 1 });
  assert.equal(totalsFor(r.db, 'adel', '2026-10-29').count, 0); // nobody else sees it
});

test('custom foods need a name and a sensible calorie amount', () => {
  const bad = addFoodEntry(db(), 'ashkan', { meal: 'lunch', name: ' ', kcal: '' });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.fields, { name: 'required', kcal: 'required' });
  assert.deepEqual(addFoodEntry(db(), 'ashkan', { meal: 'lunch', name: 'x', kcal: 99999 }).fields, { kcal: 'invalid' });
  const good = addFoodEntry(db(), 'ashkan', { date: '2026-10-29', meal: 'lunch', name: 'پلو مرغ', kcal: 650, protein: 30 }, NOW);
  assert.ok(good.ok);
  assert.equal(good.entry.kcal, 650);
  assert.equal(good.entry.protein, 30);
});

test('servings are limited, unknown foods and unknown people are refused', () => {
  assert.deepEqual(addFoodEntry(db(), 'ashkan', { meal: 'snack', foodId: 'apple', servings: 0 }).fields, { servings: 'invalid' });
  assert.deepEqual(addFoodEntry(db(), 'ashkan', { meal: 'snack', foodId: 'apple', servings: 21 }).fields, { servings: 'invalid' });
  assert.equal(addFoodEntry(db(), 'ashkan', { meal: 'snack', foodId: 'nope' }).error, 'not_found');
  assert.equal(addFoodEntry(db(), 'ghost', { meal: 'snack', foodId: 'apple' }).error, 'forbidden');
});

test('only the owner can remove or change an item; servings recompute the numbers', () => {
  const added = addFoodEntry(db(), 'ashkan', { date: '2026-10-29', meal: 'snack', foodId: 'banana', servings: 1 }, NOW);
  const id = added.entry.id;
  assert.equal(removeFoodEntry(added.db, 'adel', id).error, 'not_found');
  const more = setEntryServings(added.db, 'ashkan', id, 3);
  assert.equal(entriesFor(more.db, 'ashkan', '2026-10-29')[0].kcal, 315);
  assert.equal(setEntryServings(added.db, 'ashkan', id, 0).error, 'invalid');
  assert.equal(entriesFor(removeFoodEntry(added.db, 'ashkan', id).db, 'ashkan', '2026-10-29').length, 0);
});

test('recent foods are distinct, newest first', () => {
  let state = db();
  for (const [foodId, at] of [['apple', 1], ['banana', 2], ['apple', 3]]) state = addFoodEntry(state, 'ashkan', { date: '2026-10-29', meal: 'snack', foodId }, NOW + at * 1000).db;
  assert.deepEqual(recentFoodIds(state, 'ashkan'), ['apple', 'banana']);
});

test('water is clamped, stored once per person per day, and zero removes the row', () => {
  let state = setWater(db(), 'ashkan', '2026-10-29', 3).db;
  state = setWater(state, 'ashkan', '2026-10-29', 5).db;
  assert.equal(state.waterLog.length, 1);
  assert.equal(waterFor(state, 'ashkan', '2026-10-29'), 5);
  assert.equal(waterFor(setWater(state, 'ashkan', '2026-10-29', 999).db, 'ashkan', '2026-10-29'), 30);
  assert.equal(setWater(state, 'ashkan', '2026-10-29', 0).db.waterLog.length, 0);
  assert.equal(setWater(state, 'ghost', '2026-10-29', 2).ok, false);
});

test('the daily estimate is gentle, needs a full profile, and the water goal stays in range', () => {
  assert.equal(dailyTarget({ age: 27 }), null);
  const base = { age: 30, height: 175, weight: 75 };
  const keep = dailyTarget({ ...base, goal: 'fitness' }).kcal;
  const cut = dailyTarget({ ...base, goal: 'fatloss' }).kcal;
  const gain = dailyTarget({ ...base, goal: 'muscle' }).kcal;
  assert.ok(cut < keep && keep < gain);
  assert.ok(cut >= keep * 0.88); // never a crash diet
  assert.ok(dailyTarget({ age: 70, height: 140, weight: 38, goal: 'fatloss' }).kcal >= 1400);
  assert.equal(waterGoal({}), 8);
  assert.equal(waterGoal({ weight: 30 }), 6);
  assert.equal(waterGoal({ weight: 200 }), 14);
});

test('recentDays covers a week ending on the given day', () => {
  const added = addFoodEntry(db(), 'ashkan', { date: '2026-10-27', meal: 'lunch', name: 'x', kcal: 500 }, NOW);
  const week = recentDays(added.db, 'ashkan', '2026-10-29');
  assert.equal(week.length, 7);
  assert.equal(week[0].date, '2026-10-23');
  assert.equal(week[6].date, '2026-10-29');
  assert.equal(week.find((d) => d.date === '2026-10-27').kcal, 500);
});
