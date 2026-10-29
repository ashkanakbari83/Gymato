import { useSyncExternalStore } from 'react';
import { getSnapshot, subscribe } from '../lib/pwa.js';

/** { installEvent, installed, updateReady, online } — see lib/pwa.js */
export const usePwa = () => useSyncExternalStore(subscribe, getSnapshot);
