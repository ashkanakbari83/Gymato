// Admin panel numbers, platform settings, Featured expiry and the sample data behind them.
//   node --test src/lib/__tests__/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { DAY_MS, PREMIUM, SEED_RELEASE } from '../constants.js';
import { isAdmin, monthlyRevenue, platformStats, premiumRoster, provinceTable, recentPayments, topTrainers, updateSettings } from '../admin.js';
import { requestPhase } from '../access.js';
import { getIncome, getStudentStats } from '../analytics.js';
import { startCheckout } from '../domain/payments.js';
import { filterTrainers } from '../marketplace.js';
import { canGoPremium, isPremium, reconcilePremium } from '../premium.js';
import { withDefaults } from '../storage.js';

const NOW = Date.now();
const PRO = 'kamran';

test('seed: the professional trainer is an admin account with a big, believable business', () => {
  const db = createSeedState();
  const pro = db.users.find((u) => u.id === PRO);
  assert.equal(pro.isAdmin, true);
  assert.equal(pro.role, 'coach');
  assert.ok(isPremium(pro, NOW) && pro.premium.until, 'featured, with time left');
  const phases = {};
  db.requests.filter((r) => r.trainerId === PRO).forEach((r) => { const p = requestPhase(db, r, NOW); phases[p] = (phases[p] ?? 0) + 1; });
  assert.equal(phases.active, 38);
  assert.equal(phases.expired, 16);
  assert.equal(phases.pending, 4);
  assert.equal(phases.awaiting_payment, 2);
  assert.equal(getStudentStats(db, PRO, NOW).active, 38);
  const income = getIncome(db, PRO, NOW);
  assert.ok(income.total > 300000000, 'hundreds of millions of toman over six months');
  assert.ok(income.coaching > 0 && income.renewals > 0 && income.general > 0, 'all three sources');
  assert.ok(db.events.filter((e) => e.trainerId === PRO).length >= 400);
  // Every demo order is flagged, and every client has a chat and a program of their own.
  assert.ok(db.payments.every((p) => p.demo));
  const accepted = db.requests.filter((r) => r.status === 'accepted');
  assert.ok(accepted.every((r) => db.conversations.some((c) => c.requestId === r.id) && db.customPrograms.some((c) => c.requestId === r.id)));
  assert.equal(new Set(db.payments.map((p) => p.id)).size, db.payments.length, 'payment ids are unique');
});

test('seed: every province has sample trainers and some of them are featured', () => {
  const db = createSeedState();
  const table = provinceTable(db, NOW);
  for (const id of ['tehran', 'alborz', 'isfahan', 'razavi', 'fars', 'east-azerbaijan', 'mazandaran', 'khuzestan', 'kerman', 'gilan']) {
    const row = table.find((r) => r.id === id);
    assert.ok(row.trainers >= 8, `${id} has trainers`);
    assert.ok(row.featured >= 2, `${id} has featured trainers`);
  }
  assert.equal(new Set(db.users.map((u) => u.id)).size, db.users.length);
  assert.equal(new Set(db.users.map((u) => u.publicId)).size, db.users.length);
});

test('platform stats add up', () => {
  const db = createSeedState();
  const stats = platformStats(db, NOW);
  assert.equal(stats.users, db.users.length);
  assert.equal(stats.accounts, 5);
  assert.equal(stats.featured, premiumRoster(db, NOW).length);
  assert.equal(stats.mrr, stats.featured * PREMIUM.price);
  assert.ok(stats.premiumRevenue >= stats.featured * PREMIUM.price);
  assert.equal(stats.commission, Math.round((stats.volume * 10) / 100));
  assert.ok(stats.volume >= getIncome(db, PRO, NOW).total);
  const months = monthlyRevenue(db, NOW, 6);
  assert.equal(months.length, 6);
  assert.ok(months.every((m) => m.volume >= 0));
  assert.ok(months.reduce((total, m) => total + m.volume, 0) <= stats.volume);
});

test('top trainers: sorted by the chosen measure; the professional trainer leads in income', () => {
  const db = createSeedState();
  const byIncome = topTrainers(db, { by: 'income', limit: 3 }, NOW);
  assert.equal(byIncome[0].trainer.id, PRO);
  const byScore = topTrainers(db, { by: 'score', limit: 20 }, NOW);
  assert.deepEqual(byScore.map((r) => r.score), [...byScore.map((r) => r.score)].sort((a, b) => b - a));
  assert.equal(recentPayments(db, 5).length, 5);
});

test('settings: only an admin changes them, values are checked; there is no cap on featured places', () => {
  const db = createSeedState();
  assert.equal(isAdmin(db.users.find((u) => u.id === 'adel')), true);
  assert.equal(isAdmin(db.users.find((u) => u.id === 'kian')), false);
  assert.equal(updateSettings(db, 'kian', { commissionRate: 5 }).error, 'forbidden');
  assert.equal(updateSettings(db, 'adel', { commissionRate: 80 }).error, 'validation');
  assert.equal(updateSettings(db, 'adel', { commissionRate: 2.5 }).error, 'validation');
  const changed = updateSettings(db, 'adel', { commissionRate: 12 }).db;
  assert.equal(changed.settings.commissionRate, 12);
  assert.equal(platformStats(changed, NOW).commissionRate, 12);
  assert.equal('premiumSlots' in changed.settings, false);
  // Tehran already has five featured trainers; one more can join.
  assert.equal(filterTrainers(db, { province: 'tehran', premiumOnly: true }, NOW).length, 5);
  assert.equal(canGoPremium(db, db.users.find((u) => u.id === 'th-2'), NOW).ok, true);
});

test('featured only: the filter keeps just trainers with an active subscription', () => {
  const db = createSeedState();
  const featured = filterTrainers(db, { premiumOnly: true }, NOW);
  assert.ok(featured.length >= 25 && featured.every((u) => isPremium(u, NOW)));
  assert.ok(filterTrainers(db, { premiumOnly: true, province: 'gilan' }, NOW).length === 5);
});

test('expiry: a heads-up in the last week and a note when it ends, each sent once; sample trainers are not notified', () => {
  const db = createSeedState();
  const pro = db.users.find((u) => u.id === PRO);
  assert.equal(reconcilePremium(db, NOW), null, 'nothing to say with weeks left');

  const soonAt = new Date(pro.premium.until).getTime() - 3 * DAY_MS;
  const soon = reconcilePremium(db, soonAt);
  assert.equal(soon.notifications.filter((n) => n.type === 'premium_expiring' && n.userId === PRO).length, 1);
  const afterSoon = { ...db, ...soon };
  assert.equal(reconcilePremium(afterSoon, soonAt + 1000), null, 'not sent twice');

  const endedAt = new Date(pro.premium.until).getTime() + DAY_MS;
  const ended = reconcilePremium(afterSoon, endedAt);
  assert.equal(ended.notifications.filter((n) => n.type === 'premium_expired' && n.userId === PRO).length, 1);
  assert.equal(ended.notifications.filter((n) => n.userId !== PRO && n.type.startsWith('premium_')).length, 0, 'sample trainers have no account to notify');
  const afterEnd = { ...afterSoon, ...ended };
  assert.equal(isPremium(afterEnd.users.find((u) => u.id === PRO), endedAt), false, 'out of the featured group');
  assert.equal(filterTrainers(afterEnd, { province: 'tehran', premiumOnly: true }, endedAt).some((u) => u.id === PRO), false);
  assert.equal(reconcilePremium(afterEnd, endedAt + 1000), null);

  // Renewing starts fresh flags and a new period.
  const renewed = startCheckout({ ...afterEnd, users: afterEnd.users.map((u) => (u.id === PRO ? { ...u, premium: { ...u.premium, until: new Date(NOW + 2 * DAY_MS).toISOString(), notifiedSoon: undefined, notifiedEnded: undefined } } : u)) }, PRO, { kind: 'premium_subscription', targetId: PRO }, NOW);
  assert.equal(renewed.ok, true);
});

test('migration: a save from release 3 gets the other provinces and the professional trainer once, and keeps its own data', () => {
  const seed = createSeedState();
  const old = { ...seed, seedRelease: 3, settings: undefined, users: seed.users.filter((u) => u.id !== PRO && !/^(th|al|is|rz|fr|ea|mz|kh|km)-|^demo-(r|p)/.test(u.id)), requests: [], subscriptions: [], conversations: [], messages: [], customPrograms: [], payments: [], events: [], notifications: [] };
  old.users = old.users.map((u) => (u.id === 'ashkan' ? { ...u, name: 'نام من' } : u));
  old.payments = [{ id: 'mine', kind: 'general_purchase', athleteId: 'ashkan', trainerId: 'kian', targetId: 'gp-x', amount: 1, status: 'paid', paidAt: '2026-10-01T00:00:00.000Z' }];
  const migrated = withDefaults(old);
  assert.equal(migrated.seedRelease, SEED_RELEASE);
  assert.ok(migrated.users.some((u) => u.id === PRO) && migrated.requests.length === seed.requests.length);
  assert.ok(migrated.payments.some((p) => p.id === 'mine'), 'their own order stays');
  assert.equal(migrated.payments.length, seed.payments.length + 1);
  assert.equal(migrated.users.find((u) => u.id === 'ashkan').name, 'نام من');
  assert.equal(migrated.settings.commissionRate, 10);
  assert.equal('premiumSlots' in migrated.settings, false);
  assert.equal('premiumSlots' in withDefaults({ ...old, settings: { premiumSlots: 3, commissionRate: 15 } }).settings, false, 'the old setting is dropped');
  assert.equal(withDefaults({ ...old, settings: { premiumSlots: 3, commissionRate: 15 } }).settings.commissionRate, 15);
  assert.equal(withDefaults(migrated).payments.length, migrated.payments.length, 'running it again adds nothing');
});
