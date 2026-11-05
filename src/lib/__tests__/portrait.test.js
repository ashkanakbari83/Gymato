import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HAIR_STYLES, portraitSpec } from '../portrait.js';

test('the same name always gets the same portrait, ignoring case and outer spaces', () => {
  assert.deepEqual(portraitSpec('Ali Rezaei'), portraitSpec('  ali rezaei '));
  assert.deepEqual(portraitSpec('سارا احمدی'), portraitSpec('سارا احمدی'));
});

test('different names spread over many looks and every choice is valid', () => {
  const names = Array.from({ length: 60 }, (_, i) => `مربی ${i} نمونه`);
  const specs = names.map(portraitSpec);
  assert.ok(new Set(specs.map((s) => s.skin)).size >= 3);
  assert.ok(new Set(specs.map((s) => s.background)).size >= 5);
  assert.ok(new Set(specs.map((s) => s.style)).size >= 4);
  assert.ok(specs.every((s) => HAIR_STYLES.includes(s.style) && s.skin && s.hair && s.background && s.shirt));
  assert.ok(new Set(specs.map((s) => JSON.stringify(s))).size > 40);
});

test('a missing name still gives a portrait', () => {
  assert.ok(portraitSpec(undefined).skin);
});
