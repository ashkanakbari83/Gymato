// Views, likes, reviews, statistics and income, plus the money-input parser.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { DAY_MS } from '../constants.js';
import { claimFreeProgram } from '../domain/catalog.js';
import { acceptRequest, saveCustomProgram, submitRequest } from '../domain/coaching.js';
import { recordView, reviewBlocker, submitReview, toggleLike } from '../domain/engagement.js';
import { confirmPayment, startCheckout } from '../domain/payments.js';
import { getIncome, getIncomeByWeek, getProgramStats, getTrainerStats } from '../analytics.js';
import { parseMoney } from '../format.js';

const NOW = Date.UTC(2026, 9, 21, 9, 0, 0);
const must = (r) => { assert.equal(r.ok, true, `expected ok, got ${r.error} ${JSON.stringify(r.fields ?? {})}`); return r; };
const buy = (db, athlete, kind, targetId, at = NOW) => {
  const started = must(startCheckout(db, athlete, { kind, targetId }, at));
  return must(confirmPayment(started.db, athlete, started.payment.id, at)).db;
};

test('views: athletes count once a day; trainers and repeats do not', () => {
  let db = createSeedState();
  db = must(recordView(db, 'ashkan', 'program', 'gp-six-pack', NOW)).db;
  db = must(recordView(db, 'ashkan', 'program', 'gp-six-pack', NOW + 3600000)).db; // same day: ignored
  db = must(recordView(db, 'bardia', 'program', 'gp-six-pack', NOW)).db;
  db = must(recordView(db, 'adel', 'program', 'gp-six-pack', NOW)).db; // trainer: ignored
  db = must(recordView(db, 'ashkan', 'trainer', 'adel', NOW)).db;
  assert.equal(getProgramStats(db, 'gp-six-pack').views, 2);
  assert.equal(getTrainerStats(db, 'adel').profileViews, 1);
  db = must(recordView(db, 'ashkan', 'program', 'gp-six-pack', NOW + DAY_MS + 1)).db; // next day counts again
  assert.equal(getProgramStats(db, 'gp-six-pack').views, 3);
  assert.equal(getTrainerStats(db, 'adel').programViews, 3);
});

test('likes toggle, only for athletes and published programs', () => {
  const db = createSeedState();
  const liked = must(toggleLike(db, 'ashkan', 'gp-six-pack', NOW));
  assert.equal(liked.liked, true);
  assert.equal(getTrainerStats(liked.db, 'adel').likes, 1);
  assert.equal(must(toggleLike(liked.db, 'ashkan', 'gp-six-pack', NOW)).liked, false);
  assert.equal(toggleLike(db, 'adel', 'gp-six-pack', NOW).error, 'forbidden');
  assert.equal(toggleLike(db, 'ashkan', 'nope', NOW).error, 'not_found');
});

test('reviews need real use: free = saved it, paid = confirmed purchase, coaching = paid at least once', () => {
  let db = createSeedState();
  assert.equal(reviewBlocker(db, 'ashkan', 'program', 'gp-beginner-full-body'), 'review_not_allowed');
  assert.equal(submitReview(db, 'ashkan', { targetKind: 'program', targetId: 'gp-six-pack', rating: 5 }, NOW).error, 'review_not_allowed');
  db = must(claimFreeProgram(db, 'ashkan', 'gp-beginner-full-body', NOW)).db;
  assert.equal(reviewBlocker(db, 'ashkan', 'program', 'gp-beginner-full-body'), null);
  assert.equal(submitReview(db, 'ashkan', { targetKind: 'program', targetId: 'gp-beginner-full-body', rating: 7 }, NOW).error, 'validation');
  assert.equal(reviewBlocker(db, 'kian', 'program', 'gp-beginner-full-body'), 'forbidden', 'trainers cannot review');

  db = buy(db, 'ashkan', 'general_purchase', 'gp-six-pack');
  const first = must(submitReview(db, 'ashkan', { targetKind: 'program', targetId: 'gp-six-pack', rating: 4, text: 'good' }, NOW));
  assert.equal(first.db.notifications[0].type, 'review_new');
  const edited = must(submitReview(first.db, 'ashkan', { targetKind: 'program', targetId: 'gp-six-pack', rating: 5, text: 'great' }, NOW + 1000));
  assert.equal(edited.db.reviews.filter((r) => r.athleteId === 'ashkan').length, 1, 'one review per athlete per target; sending again edits it');
  assert.equal(getProgramStats(edited.db, 'gp-six-pack').avg, 5);
  assert.equal(getTrainerStats(edited.db, 'adel').count, 1);

  // coaching: not before a payment
  const offer = { price: 800000, renewalPrice: 500000, durationDays: 30 };
  const req = must(submitRequest(db, 'bardia', 'adel', { name: 'b', goal: 'fatloss', level: 'beginner', daysPerWeek: 3 }, NOW));
  let c = must(acceptRequest(req.db, 'adel', req.request.id, offer, NOW)).db;
  assert.equal(reviewBlocker(c, 'bardia', 'coaching', req.request.id), 'review_not_allowed');
  c = must(saveCustomProgram(c, 'adel', req.request.id, { title: 't', exercises: ['squat'], daysPerWeek: 3, durationWeeks: 4, offer }, { publish: true }, NOW)).db;
  assert.equal(reviewBlocker(c, 'bardia', 'coaching', req.request.id), 'review_not_allowed', 'proposal alone is not enough');
  c = buy(c, 'bardia', 'coaching_initial', c.subscriptions[0].id);
  assert.equal(reviewBlocker(c, 'bardia', 'coaching', req.request.id), null);
  assert.equal(reviewBlocker(c, 'ashkan', 'coaching', req.request.id), 'forbidden', 'only that coaching client');
});

test('income: gross payments by source, last 30 days and weekly buckets', () => {
  let db = createSeedState();
  db = buy(db, 'ashkan', 'general_purchase', 'gp-six-pack', NOW - 40 * DAY_MS);
  db = buy(db, 'bardia', 'general_purchase', 'gp-six-pack', NOW - 2 * DAY_MS);
  const offer = { price: 800000, renewalPrice: 500000, durationDays: 30 };
  const req = must(submitRequest(db, 'mohammad', 'adel', { name: 'm', goal: 'endurance', level: 'beginner', daysPerWeek: 3 }, NOW - 10 * DAY_MS));
  db = must(acceptRequest(req.db, 'adel', req.request.id, offer, NOW - 10 * DAY_MS)).db;
  db = must(saveCustomProgram(db, 'adel', req.request.id, { title: 't', exercises: ['squat'], daysPerWeek: 3, durationWeeks: 4, offer }, { publish: true }, NOW - 10 * DAY_MS)).db;
  db = buy(db, 'mohammad', 'coaching_initial', db.subscriptions[0].id, NOW - 9 * DAY_MS);

  const income = getIncome(db, 'adel', NOW);
  assert.equal(income.general, 980000);
  assert.equal(income.coaching, 800000);
  assert.equal(income.total, 1780000);
  assert.equal(income.last30, 1290000, 'the 40-day-old sale is outside the window');
  assert.equal(getIncome(db, 'kian', NOW).total, 0, 'income is per trainer');
  const weeks = getIncomeByWeek(db, 'adel', NOW, 6);
  assert.equal(weeks.length, 6);
  assert.equal(weeks.reduce((sum, w) => sum + w.amount, 0), 1780000, 'six weeks cover 42 days, so every payment here is inside');
  assert.equal(weeks[0].amount, 490000, 'the 40-day-old sale is in the oldest bucket');
  assert.equal(weeks[5].amount, 490000, 'the sale from 2 days ago is in the newest bucket');
  const stats = getProgramStats(db, 'gp-six-pack');
  assert.equal(stats.sales, 2);
  assert.equal(stats.revenue, 980000);
});

test('money input parser accepts Persian, Arabic and Latin digits and separators', () => {
  assert.equal(parseMoney('۴۹۰٬۰۰۰ تومان'), '490000');
  assert.equal(parseMoney('1,250,000'), '1250000');
  assert.equal(parseMoney('٣٥٠٠٠'), '35000');
  assert.equal(parseMoney('abc'), '');
  assert.equal(parseMoney(''), '');
});
