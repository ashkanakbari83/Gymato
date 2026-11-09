// localStorage persistence. All reads/writes of the app state go through here.
import { DEFAULT_FEEDBACK } from './feedback.js';
import { DEFAULT_SETTINGS, LEGACY_STORAGE_KEY, PREVIOUS_STORAGE_KEY, SEED_RELEASE, STATE_VERSION, STORAGE_KEY } from './constants.js';

/**
 * The starter data (people, programs, sample business) is big and is only needed on a first run, for a migration, or
 * when an older backup is restored. So it is NOT bundled with the app's first load: `ensureSeed()` fetches it on
 * demand and everything below reads it through `createSeedState()`. A normal start (an up-to-date save) never loads it.
 */
let seedFactory = null;
export const provideSeed = (factory) => { seedFactory = factory; };
export async function ensureSeed() {
  if (!seedFactory) provideSeed((await import('../data/seed.js')).createSeedState);
}
const createSeedState = () => {
  if (!seedFactory) throw new Error('Starter data is not loaded yet: call ensureSeed() first.');
  return seedFactory();
};

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
/** Orders used to be `initiated` / `confirmed`; they are `pending` / `paid` now (same meaning, same data). */
const LEGACY_PAYMENT_STATUS = { initiated: 'pending', confirmed: 'paid' };
const normalizePayment = ({ confirmedAt, ...payment }) => ({
  ...payment,
  status: LEGACY_PAYMENT_STATUS[payment.status] ?? payment.status,
  paidAt: payment.paidAt ?? confirmedAt ?? null,
  gatewayRef: payment.gatewayRef ?? null,
});

/**
 * Saves from before the abs release lack the new starter exercises and programs. Add whatever is missing by id
 * (never overwrite or re-add anything the person already has), once per release.
 */
/** Collections whose sample rows (release 4) are added by id to saves from before. */
const SEEDED_COLLECTIONS = ['requests', 'subscriptions', 'conversations', 'messages', 'customPrograms', 'payments', 'events', 'notifications'];

/** Only the settings that exist today, with their defaults (an old `premiumSlots` from the first admin version is dropped: there is no limit on featured places). */
function normalizeSettings(saved) {
  const { commissionRate } = saved ?? {};
  return { ...DEFAULT_SETTINGS, ...(Number.isFinite(commissionRate) ? { commissionRate } : {}) };
}

function addNewSeedContent(state) {
  if ((state.seedRelease ?? 1) >= SEED_RELEASE) return state;
  const seed = createSeedState();
  const missing = (have, fresh) => fresh.filter((item) => !have.some((x) => x.id === item.id));
  return {
    ...state,
    seedRelease: SEED_RELEASE,
    exercises: [...(state.exercises ?? []), ...missing(state.exercises ?? [], seed.exercises)],
    programs: [...(state.programs ?? []), ...missing(state.programs ?? [], seed.programs)],
    // The Gilan sample trainers (release 3): their people, likes and reviews arrive once, by id.
    users: [...(state.users ?? []), ...missing(state.users ?? [], seed.users)],
    likes: [...(state.likes ?? []), ...missing(state.likes ?? [], seed.likes)],
    reviews: [...(state.reviews ?? []), ...missing(state.reviews ?? [], seed.reviews)],
    // The other provinces and the professional trainer (release 4): their clients, income, chats and views arrive once, by id.
    ...Object.fromEntries(SEEDED_COLLECTIONS.map((key) => [key, [...(state[key] ?? []), ...missing(state[key] ?? [], seed[key])]])),
  };
}

export const withDefaults = (raw) => {
  const state = addNewSeedContent(raw);
  return {
    ...Object.fromEntries(ADDED_COLLECTIONS.map((key) => [key, []])),
    ...state,
    payments: (state.payments ?? []).map(normalizePayment),
    settings: normalizeSettings(state.settings),
    feedback: { ...DEFAULT_FEEDBACK, ...(state.feedback ?? {}) }, // sound / vibration / keep-awake preferences
  };
};

/** True when starting needs the starter data: nothing saved yet, an older format, or an older seed release. */
// A first run or an upgrade has to be written once; a plain start already matches what is saved, so it skips that write.
let bootNeedsSave = true;
let firstSave = true;
let storedBefore = false;
export function needsSeed() {
  const saved = readJson(STORAGE_KEY);
  bootNeedsSave = !(saved?.version === STATE_VERSION && saved.users && saved.requests && (saved.seedRelease ?? 1) >= SEED_RELEASE);
  storedBefore = !bootNeedsSave;
  return bootNeedsSave;
}

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

/**
 * Saving writes the whole state (hundreds of KB), which blocks the page for a moment. So changes are collected and
 * written once, shortly after the last one (`SAVE_DELAY`), and always right away when the page is hidden or closed.
 * A burst of changes (typing, a workout timer, several actions in a row) costs one write instead of many.
 */
const SAVE_DELAY = 250;
let pending = null;
let timer = 0;
export function flushState() {
  clearTimeout(timer);
  timer = 0;
  if (!pending) return;
  const state = pending;
  pending = null;
  try {
    // The saved data was wiped from outside (another tab, site data cleared) after we had written it: do not bring it back.
    if (storedBefore && localStorage.getItem(STORAGE_KEY) === null) return;
    saveState(state);
    storedBefore = true;
  } catch (error) {
    console.error('Could not save the app data', error); // storage full or blocked; the app keeps working from memory
  }
}
export function scheduleSave(state) {
  if (firstSave) {
    firstSave = false;
    if (!bootNeedsSave) return; // the state on screen is the state that was just read
    pending = state;
    flushState();
    return;
  }
  pending = state;
  clearTimeout(timer);
  timer = setTimeout(flushState, SAVE_DELAY);
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushState);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushState(); });
}
/** Reset: also drops older saves, otherwise they would be migrated straight back in. */
export const clearState = () => {
  clearTimeout(timer); // a save still waiting must not bring the data back when the page reloads
  timer = 0;
  pending = null;
  [STORAGE_KEY, PREVIOUS_STORAGE_KEY, LEGACY_STORAGE_KEY].forEach((key) => localStorage.removeItem(key));
};
