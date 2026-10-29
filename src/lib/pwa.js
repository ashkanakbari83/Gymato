// Installing the app and using it offline. State is kept here, outside React, because the browser fires
// `beforeinstallprompt` once, early; the UI reads it through usePwa() (a useSyncExternalStore subscription).

const standaloneQuery = () => typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)');
const isStandalone = () => Boolean(standaloneQuery()?.matches) || globalThis.navigator?.standalone === true;

let state = {
  installEvent: null, // the browser's install prompt (Chromium / Android), when it offers one
  installed: isStandalone(), // running as an installed app
  updateReady: false, // a newer version was downloaded and waits for the person's OK
  online: globalThis.navigator?.onLine ?? true,
};
const listeners = new Set();
const set = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getSnapshot = () => state;

/** iPhone / iPad Safari has no install prompt: the person has to use "Add to Home Screen". */
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Shows the browser's install dialog. Resolves to 'accepted' | 'dismissed' | 'unavailable'. */
export async function promptInstall() {
  const event = state.installEvent;
  if (!event) return 'unavailable';
  event.prompt();
  const { outcome } = await event.userChoice;
  set({ installEvent: null });
  return outcome;
}

let waiting = null;
let applying = false;

/** Lets the waiting version take over; the page reloads once it has. */
export function applyUpdate() {
  applying = true;
  waiting?.postMessage('SKIP_WAITING');
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return; // dev server: no caching
  try {
    const registration = await navigator.serviceWorker.register('./sw.js');
    const offer = (worker) => {
      // The very first install is not an update: there is no older version that needs replacing.
      if (!worker || !navigator.serviceWorker.controller) return;
      waiting = worker;
      set({ updateReady: true });
    };
    offer(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => worker.state === 'installed' && offer(worker));
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => applying && location.reload());
    // look for a new version whenever the app comes back to the foreground
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && registration.update().catch(() => {}));
  } catch {
    // registration failed (private mode, blocked): the app just keeps working online
  }
}

let started = false;
/** Call once at startup, before React renders. */
export function initPwa() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // we show our own button instead of the automatic mini-bar
    set({ installEvent: event });
  });
  window.addEventListener('appinstalled', () => set({ installed: true, installEvent: null }));
  window.addEventListener('online', () => set({ online: true }));
  window.addEventListener('offline', () => set({ online: false }));
  standaloneQuery()?.addEventListener?.('change', () => set({ installed: isStandalone() }));
  registerServiceWorker();
}
