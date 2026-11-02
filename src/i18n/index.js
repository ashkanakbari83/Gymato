// Tiny i18n layer: flat dictionaries per language, {param} interpolation (numbers take the active digits), Persian as fallback.
import { num } from '../lib/format.js';
import { en } from './en.js';
import { fa } from './fa.js';

const DICTIONARIES = { fa, en };

/** translate('en', 'common.free') / translate('fa', 'x.y', { name: 'Ali' }) */
export function translate(lang, key, params) {
  const text = DICTIONARIES[lang]?.[key] ?? DICTIONARIES.fa[key] ?? key;
  return params ? text.replace(/\{(\w+)\}/g, (_, name) => typeof params[name] === 'number' ? num(params[name]) : (params[name] ?? '')) : text;
}

export const hasKey = (lang, key) => key in (DICTIONARIES[lang] ?? {});
export const LANGUAGES = Object.keys(DICTIONARIES);
