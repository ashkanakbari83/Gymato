// localStorage persistence. All reads/writes of the app state go through here.
import { createSeedState } from '../data/seed.js';
import { DEFAULT_FEEDBACK } from './feedback.js';
import { LEGACY_STORAGE_KEY, PREVIOUS_STORAGE_KEY, STATE_VERSION, STORAGE_KEY } from './constants.js';

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null; // corrupted or unavailable
  }
};

/**
 * v4 (single-coach roster) -> v5 (marketplace). The data models are not compatible, so only what
 * still makes sense is carried over: preferences, favourites and finished workouts. Nothing is deleted
 * from the old key.
 */
function migrateLegacy(legacy) {
  const seed = createSeedState();
  return {
    ...seed,
    theme: legacy.theme ?? seed.theme,
    language: legacy.language ?? seed.language,
    favorites: legacy.favorites ?? [],
    sessions: (legacy.sessions ?? []).map(({ programId, ...session }) => session),
  };
}

/**
 * v5 (no sign-in) -> v6 (accounts). The people are replaced by the starter accounts, so only what still
 * belongs to them is carried over: preferences, favourites and workouts of the starter accounts.
 * Nothing is deleted from the old key.
 */
function migratePrevious(previous) {
  const seed = createSeedState();
  const known = new Set(seed.users.map((u) => u.id));
  return {
    ...seed,
    theme: previous.theme ?? seed.theme,
    language: previous.language ?? seed.language,
    favorites: previous.favorites ?? [],
    sessions: (previous.sessions ?? []).filter((s) => known.has(s.userId)),
  };
}

/** Collections added after v5 shipped; older saves simply start them empty (additive, no data lost). */
const ADDED_COLLECTIONS = ['events', 'likes', 'reviews', 'foodLog', 'waterLog'];
export const withDefaults = (state) => ({
  ...Object.fromEntries(ADDED_COLLECTIONS.map((key) => [key, []])),
  ...state,
  feedback: { ...DEFAULT_FEEDBACK, ...(state.feedback ?? {}) }, // sound / vibration / keep-awake preferences
});

export function loadState() {
  const saved = readJson(STORAGE_KEY);
  if (saved?.version === STATE_VERSION && saved.users && saved.requests) return withDefaults(saved);
  const previous = readJson(PREVIOUS_STORAGE_KEY);
  if (previous?.users && previous.requests) return migratePrevious(previous);
  const legacy = readJson(LEGACY_STORAGE_KEY);
  if (legacy?.users) return migrateLegacy(legacy);
  return createSeedState();
}

export const saveState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
/** Reset: also drops older saves, otherwise they would be migrated straight back in. */
export const clearState = () => [STORAGE_KEY, PREVIOUS_STORAGE_KEY, LEGACY_STORAGE_KEY].forEach((key) => localStorage.removeItem(key));
