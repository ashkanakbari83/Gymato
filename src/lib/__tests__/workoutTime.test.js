// The workout clock: paused time is not training time, and the total stops when the last set is logged.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDuration, formatPrice, groupNumber, parseMoney, setFormatLanguage } from '../format.js';
import { translate } from '../../i18n/index.js';
import { activeSeconds, finishPatch, pausePatch, reopenPatch, resumePatch } from '../workoutTime.js';

const S = 1000;
const start = 1_000_000;
const fresh = () => ({ startedAt: start, pausedMs: 0, pausedAt: null, finishedAt: null });

test('time runs from the start and ignores a missing pause history (older saved workouts)', () => {
  assert.equal(activeSeconds(fresh(), start + 90 * S), 90);
  assert.equal(activeSeconds({ startedAt: start }, start + 30 * S), 30);
  assert.equal(activeSeconds(null), 0);
  assert.equal(activeSeconds(fresh(), start - 5 * S), 0, 'never negative');
});

test('pausing stops the clock and resuming banks the paused time', () => {
  let w = fresh();
  w = { ...w, ...pausePatch(w, start + 60 * S) };
  assert.equal(activeSeconds(w, start + 600 * S), 60, 'frozen while paused');
  assert.deepEqual(pausePatch(w, start + 90 * S), { state: 'paused', pausedAt: start + 60 * S }, 'pausing twice keeps the first moment');
  w = { ...w, ...resumePatch(w, start + 180 * S) }; // paused for 120 s
  assert.equal(w.pausedMs, 120 * S);
  assert.equal(activeSeconds(w, start + 240 * S), 120, '240 s since start minus 120 s paused');
});

test('after the last set the total stays fixed, and going back does not count the time on the finish screen', () => {
  let w = fresh();
  w = { ...w, ...finishPatch(start + 600 * S) };
  assert.equal(activeSeconds(w, start + 600 * S), 600);
  assert.equal(activeSeconds(w, start + 9000 * S), 600, 'the finish screen no longer ticks');
  w = { ...w, ...reopenPatch(w, start + 660 * S) };
  assert.equal(w.finishedAt, null);
  assert.equal(activeSeconds(w, start + 700 * S), 640, '700 s minus the 60 s spent on the finish screen');
});

test('durations read as words: seconds under a minute, then whole minutes, then hours', () => {
  setFormatLanguage('en');
  const t = (key, params) => translate('en', key, params);
  assert.equal(formatDuration(0, t), '0 sec');
  assert.equal(formatDuration(45, t), '45 sec');
  assert.equal(formatDuration(600, t), '10 min');
  assert.equal(formatDuration(629, t), '10 min');
  assert.equal(formatDuration(3600, t), '1 h');
  assert.equal(formatDuration(3900, t), '1 h 5 min');
  setFormatLanguage('fa');
  const fa = (key, params) => translate('fa', key, params);
  assert.equal(formatDuration(600, fa), '۱۰ دقیقه');
  assert.equal(formatDuration(30, fa), '۳۰ ثانیه');
  assert.equal(formatDuration(5400, fa), '۱ ساعت و ۳۰ دقیقه');
});

test('prices are grouped by hand, the same on every device, and parse back to the number', () => {
  setFormatLanguage('fa');
  const fa = (key) => translate('fa', key);
  assert.equal(groupNumber(1250000), '۱٬۲۵۰٬۰۰۰');
  assert.equal(groupNumber(490000), '۴۹۰٬۰۰۰');
  assert.equal(groupNumber(0), '۰');
  assert.equal(formatPrice(1250000, fa), '۱٬۲۵۰٬۰۰۰ تومان');
  assert.equal(formatPrice(0, fa), 'رایگان');
  assert.equal(parseMoney(groupNumber(1250000)), '1250000');
  setFormatLanguage('en');
  assert.equal(groupNumber(1250000), '1,250,000');
  assert.equal(formatPrice(99000, (key) => translate('en', key)), '99,000 Toman');
  setFormatLanguage('fa');
});
