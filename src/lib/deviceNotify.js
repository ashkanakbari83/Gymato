// Device (system) notifications: the banner the phone or computer shows for an app notification, even when the
// app is in another tab or behind another app. Opt-in (Settings), and honest about its limit: it only works while the
// app is still alive in the background. A closed app is not woken up; that needs a server that sends Web Push
// messages, which this local-only version does not have.

export const canNotifyDevice = () => typeof window !== 'undefined' && 'Notification' in window;

/** 'unsupported' | 'default' (never asked) | 'granted' | 'denied' */
export const devicePermission = () => (canNotifyDevice() ? Notification.permission : 'unsupported');

/** Asks the browser for permission. Call it from a tap: browsers refuse prompts that are not a response to one. */
export async function askDevicePermission() {
  if (!canNotifyDevice()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * The notifications that came in since `seenIds` and should be announced to the device: addressed to this user,
 * unread, and not announced before. Newest last, so they appear in the order they happened.
 */
export function pickNewNotifications(notifications, userId, seenIds) {
  return (notifications ?? [])
    .filter((n) => n.userId === userId && !n.read && !seenIds.has(n.id))
    .sort((a, b) => a.createdAt - b.createdAt);
}

/** Shown as one banner per notification, but never more than `limit` at once (the rest are summed up by the caller). */
export const MAX_BANNERS = 3;

/**
 * Shows one banner. It goes through the service worker when there is one (the only way that works on Android Chrome,
 * and it lets a tap reopen the app), otherwise through a plain Notification. Returns true when something was shown.
 */
export async function showDeviceNotification({ title, body, target, tag }) {
  if (devicePermission() !== 'granted') return false;
  const options = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { target: target ?? null } };
  try {
    const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
    const note = new Notification(title, options);
    note.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent('jimato:open-target', { detail: target ?? null }));
      note.close();
    };
    return true;
  } catch {
    return false;
  }
}
