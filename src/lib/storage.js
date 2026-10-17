// localStorage persistence for the app state.
import { createSeedState } from '../data/seed';
import { STORAGE_KEY } from './constants';

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.users && saved?.exercises) return saved;
  } catch {
    /* corrupted or missing data: fall back to the seed */
  }
  return createSeedState();
}

export const saveState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
export const clearState = () => localStorage.removeItem(STORAGE_KEY);
