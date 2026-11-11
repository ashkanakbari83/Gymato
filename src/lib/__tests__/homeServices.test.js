// The home launcher: who sees which tiles and what the badges count.
//   node --test src/lib/__tests__/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { homeServices } from '../homeServices.js';

const db = createSeedState();
const ids = (list) => list.map((t) => t.id);
const all = (s) => [...s.main, ...s.groups.flatMap((g) => g.items)];

test('an athlete gets the four athlete services, tools and one tile per exercise category', () => {
  const athlete = db.users.find((u) => u.role === 'athlete' && !u.isAdmin) ?? db.users.find((u) => u.role === 'athlete');
  const s = homeServices(db, athlete);
  assert.deepEqual(ids(s.main), ['trainers', 'programs', 'exercises', 'nutrition']);
  const moves = s.groups.find((g) => g.id === 'moves');
  assert.equal(moves.items.length, new Set(db.exercises.map((e) => e.cat)).size);
  assert.ok(moves.items.every((t) => t.action.page === 'exercises' && t.action.params.category));
  assert.ok(!ids(all(s)).includes('admin'));
});

test('a trainer gets the trainer services; the admin tile only for admins', () => {
  const trainer = db.users.find((u) => u.role === 'coach' && !u.isAdmin);
  const plain = homeServices(db, trainer);
  assert.deepEqual(ids(plain.main), ['clients', 'programs', 'insights', 'premium']);
  assert.ok(!ids(all(plain)).includes('admin'));
  const admin = homeServices(db, { ...trainer, isAdmin: true });
  assert.ok(ids(all(admin)).includes('admin'));
});

test('badges count what waits: unread alerts and pending clients; zero shows nothing', () => {
  const trainer = db.users.find((u) => u.role === 'coach' && !u.isAdmin);
  const quiet = { ...db, requests: [], notifications: [] };
  assert.equal(all(homeServices(quiet, trainer)).find((t) => t.id === 'notifications').badge, null);
  assert.equal(homeServices(quiet, trainer).main[0].badge, null);
  const noisy = { ...quiet, notifications: [{ id: 'n1', userId: trainer.id, read: false }, { id: 'n2', userId: trainer.id, read: true }] };
  assert.deepEqual(all(homeServices(noisy, trainer)).find((t) => t.id === 'notifications').badge, { kind: 'count', value: 1 });
});

test('the "near me" tile exists only when the athlete has a province, and opens the trainer list there', () => {
  const athlete = db.users.find((u) => u.role === 'athlete');
  const without = homeServices(db, { ...athlete, province: '' });
  assert.ok(!ids(all(without)).includes('nearby'));
  const withProvince = homeServices(db, { ...athlete, province: 'gilan' });
  assert.deepEqual(all(withProvince).find((t) => t.id === 'nearby').action, { type: 'page', page: 'trainers', params: { province: 'gilan' } });
});
