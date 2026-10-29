import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSeedState } from '../../data/seed.js';
import { translate } from '../../i18n/index.js';
import { setFormatLanguage } from '../format.js';
import { buildProgramCard, buildTrainerCard, shareUrl } from '../shareCard.js';

const t = (key, params) => translate('fa', key, params);
setFormatLanguage('fa');

test('share links carry the trainer public ID and the program ID, and drop old query/hash', () => {
  const url = shareUrl({ trainer: { publicId: 'JM-A1D3L0' }, program: { id: 'gp-six-pack' } }, 'https://jimato.app/x/?old=1#h');
  assert.equal(url, 'https://jimato.app/x/?trainer=JM-A1D3L0&program=gp-six-pack');
  assert.equal(shareUrl({}, 'https://jimato.app/'), 'https://jimato.app/');
});

test('a program card has the title, trainer, facts, price and a link back to the app', () => {
  const db = createSeedState();
  const card = buildProgramCard(db, db.programs.find((p) => p.id === 'gp-six-pack'), t, 'fa');
  assert.equal(card.title, 'سیکس پک در ۳۰ روز');
  assert.match(card.byline, /عادل/);
  assert.equal(card.free, false);
  assert.match(card.price, /تومان/);
  assert.equal(card.facts.length, 3);
  assert.match(card.url, /trainer=JM-A1D3L0&program=gp-six-pack/);
});

test('a free program says free; a trainer with reviews shows a rating, one without does not', () => {
  const db = createSeedState();
  const free = buildProgramCard(db, db.programs.find((p) => p.id === 'gp-beginner-full-body'), t, 'fa');
  assert.equal(free.free, true);
  assert.equal(free.price, 'رایگان');
  assert.ok(buildTrainerCard(db, db.users.find((u) => u.id === 'kian'), t, 'fa').rating);
  assert.equal(buildTrainerCard(db, db.users.find((u) => u.id === 'neda'), t, 'fa').rating, null);
});
