import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planNav } from '../navPlan.js';

const page = (name, params = {}) => ({ page: name, params, modal: null, depth: 0 });
const want = (name, modal = null, params = {}) => ({ page: name, params, modal });

test('nothing to do when the app already matches the entry', () => {
  assert.equal(planNav(page('home'), want('home')).type, 'none');
  assert.equal(planNav(page('trainer', { trainerId: 'a' }), want('trainer', null, { trainerId: 'a' })).type, 'none');
});

test('a page change pushes exactly one page entry', () => {
  const plan = planNav(page('home'), want('programs'));
  assert.equal(plan.type, 'push');
  assert.deepEqual(plan.entry, page('programs'));
  assert.equal(planNav(page('trainer', { trainerId: 'a' }), want('trainer', null, { trainerId: 'b' })).type, 'push');
});

test('opening a modal pushes an entry that remembers the page it sits on', () => {
  const modal = { type: 'account' };
  const plan = planNav(page('home'), want('home', modal));
  assert.equal(plan.type, 'push');
  assert.equal(plan.entry.depth, 1);
  assert.equal(plan.entry.modal, modal);
});

test('closing a modal unwinds the entries it pushed', () => {
  const open = { ...page('home'), modal: { type: 'account' }, depth: 1 };
  assert.deepEqual(planNav(open, want('home')), { type: 'unwind', steps: 1 });
  assert.deepEqual(planNav({ ...open, depth: 3 }, want('home')), { type: 'unwind', steps: 3 });
});

test('changing page while a modal is open unwinds first, then pushes the page', () => {
  const open = { ...page('home'), modal: { type: 'checkout' }, depth: 1 };
  assert.equal(planNav(open, want('programs')).type, 'unwind');
  assert.equal(planNav(page('home'), want('programs')).type, 'push'); // the next round, after the unwind landed
});

test('the same kind of modal with new props updates its entry; another kind stacks', () => {
  const open = { ...page('home'), modal: { type: 'food-add', meal: 'lunch' }, depth: 1 };
  assert.equal(planNav(open, want('home', { type: 'food-add', meal: 'dinner' })).type, 'replace');
  const stacked = planNav(open, want('home', { type: 'share' }));
  assert.equal(stacked.type, 'push');
  assert.equal(stacked.entry.depth, 2);
});

test('an identical modal does not create an entry', () => {
  const modal = { type: 'share', id: 1 };
  assert.equal(planNav({ ...page('home'), modal, depth: 1 }, want('home', { type: 'share', id: 1 })).type, 'none');
});
