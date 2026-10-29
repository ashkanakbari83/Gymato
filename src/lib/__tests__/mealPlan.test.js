import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { saveGeneralProgram } from '../domain/catalog.js';
import { blankMealPlan, logMealFor, sanitizeMealPlan } from '../mealPlan.js';

test('an empty plan is removed; empty meals are dropped; numbers and lengths are cleaned', () => {
  assert.equal(sanitizeMealPlan(null), null);
  assert.equal(sanitizeMealPlan(blankMealPlan()), null); // three blank meals, no note
  const plan = sanitizeMealPlan({
    meals: [
      { id: 'a', slot: 'breakfast', text: '  تخم‌مرغ  ', kcal: '350' },
      { id: 'b', slot: 'weird', text: 'x', kcal: -5 },
      { id: 'c', slot: 'custom', title: ' شب ', text: 'ماست', kcal: '' },
      { id: 'd', slot: 'lunch', text: '   ' },
    ],
    note: ' ',
  });
  assert.deepEqual(plan.meals.map((m) => [m.slot, m.text, m.kcal, m.title]), [['breakfast', 'تخم‌مرغ', 350, ''], ['snack', 'x', null, ''], ['custom', 'ماست', null, 'شب']]);
  assert.equal(plan.note, '');
  assert.equal(sanitizeMealPlan({ meals: [], note: 'فقط نکته' }).note, 'فقط نکته');
});

test('a plan is capped at eight meals', () => {
  const meals = Array.from({ length: 12 }, (_, i) => ({ id: String(i), slot: 'snack', text: `m${i}` }));
  assert.equal(sanitizeMealPlan({ meals }).meals.length, 8);
});

test('pre/post-workout and custom meals are logged as snacks', () => {
  assert.deepEqual(['breakfast', 'lunch', 'dinner', 'pre', 'post', 'custom'].map(logMealFor), ['breakfast', 'lunch', 'dinner', 'snack', 'snack', 'snack']);
});

test('saving a general program stores the cleaned plan, and clearing it removes it', () => {
  const db = createSeedState();
  const draft = { ...db.programs.find((p) => p.id === 'gp-six-pack') };
  assert.ok(draft.mealPlan, 'the sample program ships with a plan');
  const edited = saveGeneralProgram(db, 'adel', { ...draft, mealPlan: { meals: [{ id: 'x', slot: 'dinner', text: ' سوپ ', kcal: 300 }], note: '' } }, 'published');
  assert.ok(edited.ok);
  assert.deepEqual(edited.program.mealPlan.meals.map((m) => m.text), ['سوپ']);
  const cleared = saveGeneralProgram(edited.db, 'adel', { ...edited.program, mealPlan: null }, 'published');
  assert.equal(cleared.program.mealPlan, null);
});
