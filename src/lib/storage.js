// localStorage persistence. All reads/writes of the app state go through here.
import { createSeedState } from '../data/seed.js';
import { LEGACY_STORAGE_KEY, STATE_VERSION, STORAGE_KEY } from './constants.js';

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

export function loadState() {
  const saved = readJson(STORAGE_KEY);
  if (saved?.version === STATE_VERSION && saved.users && saved.requests) return saved;
  const legacy = readJson(LEGACY_STORAGE_KEY);
  if (legacy?.users) return migrateLegacy(legacy);
  return createSeedState();
}

export const saveState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
export const clearState = () => localStorage.removeItem(STORAGE_KEY);
