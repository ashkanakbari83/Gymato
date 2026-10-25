// Helpers shared by the domain functions. Every domain function is pure:
// (db, ...args) => { ok: true, db: nextDb, ... } | { ok: false, error: code, fields? }
import { uid } from '../format.js';

export const ok = (db, extra = {}) => ({ ok: true, db, ...extra });
export const fail = (error, fields) => ({ ok: false, error, ...(fields ? { fields } : {}) });

export const byId = (list, id) => list.find((x) => x.id === id) ?? null;
export const replaceById = (list, item) => list.map((x) => (x.id === item.id ? item : x));

/** Adds a notification. Text is rendered from `type` + `params` at display time (so it follows the language). */
export function withNotification(db, userId, type, params = {}, target = null, now = Date.now()) {
  const notification = { id: uid(), userId, type, params, target, read: false, createdAt: new Date(now).toISOString() };
  return { ...db, notifications: [notification, ...db.notifications] };
}

export const nowIso = (now) => new Date(now).toISOString();
