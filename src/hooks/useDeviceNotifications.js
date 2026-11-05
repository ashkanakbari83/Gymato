// Mirrors new in-app notifications to the device while the app is in the background, when the person turned that on.
// Notifications that were already there when the app opened are never announced (only the ones that arrive later),
// and a tap on a banner opens the screen the notification points to.
import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { MAX_BANNERS, devicePermission, pickNewNotifications, showDeviceNotification } from '../lib/deviceNotify.js';
import { feedbackPrefs } from '../lib/feedback.js';

export function useDeviceNotifications() {
  const { db, user, openTarget, t } = useApp();
  const seen = useRef(null);
  const enabled = Boolean(user) && feedbackPrefs(db).deviceNotify && devicePermission() === 'granted';

  // What is already there counts as seen: only later arrivals are announced.
  useEffect(() => {
    if (!user) return;
    if (seen.current === null) seen.current = new Set();
    pickNewNotifications(db.notifications, user.id, new Set()).forEach((n) => seen.current.add(n.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || seen.current === null) return;
    const fresh = pickNewNotifications(db.notifications, user.id, seen.current);
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current.add(n.id));
    // Only worth a banner when the person is not looking at the app.
    if (!enabled || document.visibilityState === 'visible') return;
    const shown = fresh.slice(-MAX_BANNERS);
    shown.forEach((n) =>
      showDeviceNotification({ title: t(`notif.${n.type}.title`, n.params), body: t(`notif.${n.type}.text`, n.params), target: n.target, tag: n.id }),
    );
  }, [db.notifications, user, enabled, t]);

  // A tap on a banner (from the service worker, or from the plain-Notification fallback) opens its target.
  useEffect(() => {
    const open = (target) => target && openTarget(target);
    const fromWorker = (event) => event.data?.type === 'OPEN_TARGET' && open(event.data.target);
    const fromPage = (event) => open(event.detail);
    navigator.serviceWorker?.addEventListener('message', fromWorker);
    window.addEventListener('jimato:open-target', fromPage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', fromWorker);
      window.removeEventListener('jimato:open-target', fromPage);
    };
  }, [openTarget]);
}
