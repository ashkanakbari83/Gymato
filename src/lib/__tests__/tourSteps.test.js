// The interface tour: every step has a title and a text in both languages, for both sides.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasKey } from '../../i18n/index.js';
import { TOUR_STEPS, tourKey, tourSide } from '../tourSteps.js';

test('every tour step has a title and a text in fa and en', () => {
  const missing = [];
  for (const side of Object.keys(TOUR_STEPS)) {
    for (const { id } of TOUR_STEPS[side]) {
      for (const part of ['title', 'text']) for (const lang of ['fa', 'en']) if (!hasKey(lang, tourKey(side, id, part))) missing.push(`${lang}:${tourKey(side, id, part)}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('the tour is short and the sides differ', () => {
  for (const steps of Object.values(TOUR_STEPS)) assert.ok(steps.length >= 3 && steps.length <= 6);
  assert.notDeepEqual(TOUR_STEPS.athlete.map((s) => s.id), TOUR_STEPS.trainer.map((s) => s.id));
  assert.equal(tourSide({ role: 'coach' }), 'trainer');
  assert.equal(tourSide({ role: 'athlete' }), 'athlete');
});
