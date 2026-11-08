// Premium ("ویژه") trainers: score, ranking, slots, checkout and the seed for Gilan.
//   node --test src/lib/__tests__/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { PAYMENT_KIND, PREMIUM, DAY_MS, SEED_RELEASE } from '../constants.js';
import { startCheckout } from '../domain/payments.js';
import { filterTrainers } from '../marketplace.js';
import { canGoPremium, isPremium, premiumDaysLeft, premiumInProvince, provinceStanding, rankTrainers, trainerScore } from '../premium.js';
import { withDefaults } from '../storage.js';
import { settlePaid } from './helpers.js';

const NOW = Date.now();
const must = (r) => {
  assert.equal(r.ok, true, `expected ok, got ${r.error}`);
  return r;
};
const gilan = (db) => db.users.filter((u) => u.role === 'coach' && u.province === 'gilan');

test('seed: twenty trainers in Gilan, five of them featured', () => {
  const db = createSeedState();
  const trainers = gilan(db);
  assert.equal(trainers.length, 20);
  assert.equal(trainers.filter((u) => isPremium(u, NOW)).length, 5);
  assert.ok(trainers.every((u) => !isPremium(u, NOW) || premiumDaysLeft(u, NOW) > 30), 'sample subscriptions do not lapse within weeks');
  assert.equal(new Set(db.users.map((u) => u.id)).size, db.users.length, 'ids are unique');
});

test('score: between 0 and 100, more engagement scores higher, a newcomer sits in the middle on rating', () => {
  const db = createSeedState();
  const top = trainerScore(db, 'gl-aryan');
  const newcomer = trainerScore(db, 'gl-saman');
  assert.ok(top.score > newcomer.score);
  assert.ok(top.score <= 100 && newcomer.score >= 0);
  assert.equal(top.parts.reduce((sum, p) => sum + p.weight, 0), 100);
  assert.equal(trainerScore(db, 'adel').parts.find((p) => p.id === 'rating').value, 3.5, 'no reviews: the neutral prior');
});

test('ranking: featured first, then by score; payment alone does not decide the order inside a group', () => {
  const db = createSeedState();
  const order = rankTrainers(db, gilan(db), NOW);
  const flags = order.map((u) => isPremium(u, NOW));
  assert.deepEqual(flags, [...flags].sort((a, b) => Number(b) - Number(a)), 'no featured trainer after a regular one');
  const featured = order.filter((u) => isPremium(u, NOW));
  const scores = featured.map((u) => trainerScore(db, u.id).score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a), 'featured are ordered by score');
  // a featured trainer with a low score still stands above a free trainer with a higher one (the group decides), and the free one leads its own group
  const low = order.findIndex((u) => u.id === 'gl-mehrdad');
  const high = order.findIndex((u) => u.id === 'gl-ghazal');
  assert.ok(trainerScore(db, 'gl-ghazal').score > trainerScore(db, 'gl-mehrdad').score);
  assert.ok(low < high);
  assert.equal(order[5].id, 'gl-ghazal', 'the best free trainer leads the second group');
  assert.deepEqual(rankTrainers(db, gilan(db), NOW).map((u) => u.id), order.map((u) => u.id), 'stable between calls');
});

test('eligibility: no limit on how many trainers in a province can be featured', () => {
  const db = createSeedState();
  assert.equal(premiumInProvince(db, 'gilan', NOW).length, 5);
  assert.equal(canGoPremium(db, db.users.find((u) => u.id === 'gl-ghazal'), NOW).ok, true);
  assert.equal(canGoPremium(db, db.users.find((u) => u.id === 'gl-aryan'), NOW).reason, 'already_active');
  assert.equal(canGoPremium(db, db.users.find((u) => u.id === 'ashkan'), NOW).reason, 'not_trainer');
  // However many are already featured, the next trainer can still join (no waiting list, no cap).
  const crowded = { ...db, users: db.users.map((u) => (u.province === 'gilan' && u.role === 'coach' ? { ...u, premium: { until: new Date(NOW + 20 * DAY_MS).toISOString() } } : u)) };
  assert.equal(premiumInProvince(crowded, 'gilan', NOW).length, 20);
  const newcomer = { ...crowded.users.find((u) => u.id === 'gl-soheil'), premium: null };
  assert.equal(canGoPremium({ ...crowded, users: crowded.users.map((u) => (u.id === newcomer.id ? newcomer : u)) }, newcomer, NOW).ok, true);
  const noProvince = { ...db, users: db.users.map((u) => (u.id === 'adel' ? { ...u, province: '' } : u)) };
  assert.equal(canGoPremium(noProvince, noProvince.users.find((u) => u.id === 'adel'), NOW).reason, 'no_province');
});

test('checkout: the order is pending, only a verified answer activates it, renewal extends, it is not trainer income', () => {
  const db = createSeedState();
  const order = must(startCheckout(db, 'gl-ghazal', { kind: PAYMENT_KIND.PREMIUM, targetId: 'gl-ghazal' }, NOW));
  assert.equal(order.payment.amount, PREMIUM.price);
  assert.equal(order.payment.status, 'pending');
  assert.equal(order.payment.trainerId, null);
  assert.equal(isPremium(order.db.users.find((u) => u.id === 'gl-ghazal'), NOW), false, 'nothing is active before the gateway answers');

  const paid = settlePaid(order.db, 'gl-ghazal', order.payment.id, NOW);
  const trainer = paid.users.find((u) => u.id === 'gl-ghazal');
  assert.equal(isPremium(trainer, NOW), true);
  assert.equal(premiumDaysLeft(trainer, NOW), PREMIUM.days);
  assert.equal(paid.notifications.some((n) => n.userId === 'gl-ghazal' && n.type === 'premium_active'), true);

  // renewal inside the window adds a month to what is left
  const soon = { ...paid, users: paid.users.map((u) => (u.id === 'gl-ghazal' ? { ...u, premium: { ...u.premium, until: new Date(NOW + 3 * DAY_MS).toISOString() } } : u)) };
  const again = must(startCheckout(soon, 'gl-ghazal', { kind: PAYMENT_KIND.PREMIUM, targetId: 'gl-ghazal' }, NOW));
  const renewed = settlePaid(again.db, 'gl-ghazal', again.payment.id, NOW);
  assert.equal(premiumDaysLeft(renewed.users.find((u) => u.id === 'gl-ghazal'), NOW), 3 + PREMIUM.days);
});

test('checkout is refused for athletes and for someone else, and never because the province is crowded', () => {
  const db = createSeedState();
  assert.equal(startCheckout(db, 'ashkan', { kind: PAYMENT_KIND.PREMIUM, targetId: 'ashkan' }, NOW).ok, false);
  assert.equal(startCheckout(db, 'gl-ghazal', { kind: PAYMENT_KIND.PREMIUM, targetId: 'gl-soheil' }, NOW).ok, false);
  const taken = must(startCheckout(db, 'gl-ghazal', { kind: PAYMENT_KIND.PREMIUM, targetId: 'gl-ghazal' }, NOW));
  const crowded = { ...taken.db, users: taken.db.users.map((u) => (u.province === 'gilan' && u.role === 'coach' && u.id !== 'gl-ghazal' ? { ...u, premium: { until: new Date(NOW + 20 * DAY_MS).toISOString() } } : u)) };
  assert.equal(startCheckout(crowded, 'gl-ghazal', { kind: PAYMENT_KIND.PREMIUM, targetId: 'gl-ghazal' }, NOW).ok, true, 'the open order is reused');
});

test('standing: the place a trainer would take among the featured follows the score', () => {
  const db = createSeedState();
  const ghazal = db.users.find((u) => u.id === 'gl-ghazal');
  const standing = provinceStanding(db, ghazal, NOW);
  assert.equal(standing.total, 20);
  assert.ok(standing.featuredRank >= 1 && standing.featuredRank <= 6);
  assert.equal(filterTrainers(db, { province: 'gilan' }).length, 20);
});

test('migration: an older save gets the Gilan trainers once, and nothing of its own is touched', () => {
  const seed = createSeedState();
  const old = { ...seed, seedRelease: 2, users: seed.users.filter((u) => !u.id.startsWith('gl-') && !u.id.startsWith('demo-g')), likes: seed.likes.filter((l) => !l.id.includes('-gl-')), reviews: seed.reviews.filter((r) => !r.id.includes('-gl-')), programs: seed.programs.filter((p) => !p.id.startsWith('gp-gl-')) };
  old.users = old.users.map((u) => (u.id === 'ashkan' ? { ...u, name: 'نام من' } : u));
  const migrated = withDefaults(old);
  assert.equal(migrated.seedRelease, SEED_RELEASE);
  assert.equal(gilan(migrated).length, 20);
  assert.equal(migrated.users.find((u) => u.id === 'ashkan').name, 'نام من');
  assert.equal(new Set(migrated.users.map((u) => u.id)).size, migrated.users.length);
  assert.equal(withDefaults(migrated).users.length, migrated.users.length, 'running it again adds nothing');
});
