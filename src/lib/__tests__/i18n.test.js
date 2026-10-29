// Every text key used in the source must exist in both languages, and every option id needs a label.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { exercises } from '../../data/exercises.js';
import { FOCUS_AREAS, GOALS, LEVELS, PHASE } from '../constants.js';
import { hasKey } from '../../i18n/index.js';

const SRC = new URL('../../', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? (name === '__tests__' ? [] : files(path)) : /\.jsx?$/.test(name) ? [path] : [];
});

test('all statically referenced keys exist in fa and en', () => {
  const missing = [];
  for (const file of files(SRC)) {
    if (file.includes('/i18n/')) continue;
    const text = readFileSync(file, 'utf8');
    const keys = [...text.matchAll(/\bt\(\s*'([\w.-]+)'/g)].map((m) => m[1]);
    keys.push(...[...text.matchAll(/'((?:co|gp|cr|pay|home|programs|trainers?|clients|editor|deck|player|progress|settings|profile|acct|auth|duration|notif|ex|stat|common|plan|chat|body|nav|loc|session|backup|error|cal|field|onb|bmi|nutrition|food|meal|share|pwa)\.[\w.-]+)'/g)].map((m) => m[1]));
    for (const key of keys) for (const lang of ['fa', 'en']) if (!hasKey(lang, key)) missing.push(`${lang}:${key} (${file.replace(SRC, '')})`);
  }
  assert.deepEqual([...new Set(missing)], []);
});

test('option ids, categories, phases and notification types are labelled in both languages', () => {
  const need = [
    ...GOALS.map((id) => `goal.${id}`), ...FOCUS_AREAS.map((id) => `focus.${id}`), ...LEVELS.map((id) => `level.${id}`),
    ...Object.values(PHASE).map((p) => `phase.${p}`), ...[...new Set(exercises.map((e) => `cat.${e.cat}`))],
    ...['request_new', 'request_cancelled', 'request_accepted', 'request_rejected', 'program_ready', 'program_updated', 'subscription_active', 'subscription_renewed', 'purchase', 'message_new'].flatMap((t) => [`notif.${t}.title`, `notif.${t}.text`]),
    ...['pending', 'accepted', 'rejected', 'cancelled'].map((s) => `request.${s}`),
    ...['none', 'draft', 'published'].map((s) => `programStatus.${s}`),
    ...['none', 'initiated', 'confirmed', 'failed'].map((s) => `payment.${s}`),
    ...['none', 'pending_payment', 'active', 'expired', 'cancelled'].map((s) => `subscription.${s}`),
    ...['rejected', 'cancelled'].map((s) => `co.closed.${s}`), ...['general', 'custom'].map((k) => `type.${k}`),
    ...['required', 'invalid', 'too_long'].map((c) => `field.${c}`),
    ...['light', 'dark', 'system'].map((x) => `settings.theme.${x}`),
    ...['general_purchase', 'coaching_initial', 'coaching_renewal'].map((k) => `pay.kind.${k}`),
    ...['active', 'paused', 'resting', 'ready-to-finish'].map((s) => `player.state.${s}`),
    ...['athlete', 'trainer'].flatMap((r) => [`onb.role.${r}`, `onb.role.${r}.hint`]),
    ...['welcome', 'athlete', 'trainer', 'start'].map((s) => `onb.${s}.title`),
  ];
  const missing = need.flatMap((key) => ['fa', 'en'].filter((lang) => !hasKey(lang, key)).map((lang) => `${lang}:${key}`));
  assert.deepEqual(missing, []);
});

test('every error code the domain can return has a message in both languages', () => {
  const codes = new Set();
  for (const file of files(join(SRC, 'lib/domain'))) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/fail\('([a-z_]+)'/g)) codes.add(m[1]);
    for (const m of text.matchAll(/error: '([a-z_]+)'/g)) codes.add(m[1]);
  }
  codes.delete('validation'); // shown per field, not as a toast
  const missing = [...codes].flatMap((code) => ['fa', 'en'].filter((lang) => !hasKey(lang, `error.${code}`)).map((lang) => `${lang}:error.${code}`));
  assert.deepEqual(missing, []);
});
