// What the home screen offers as a launcher grid (like a super-app): one big card with the four main services, then groups of
// small tiles. Pure data: the screen turns `icon` into a drawing and `action` into a click. Labels are text keys, so both
// languages come for free. A tile can carry a badge: a number (things waiting for you) or a short word.
import { isPremium } from './premium.js';
import { getAthleteLibrary, getTrainerClients } from './marketplace.js';
import { getNotifications } from './selectors.js';

const page = (name, params) => ({ type: 'page', page: name, params });
const count = (n) => (n > 0 ? { kind: 'count', value: n } : null);
const word = (key) => ({ kind: 'text', key });

/** Icon and colour for each exercise category (unknown ones fall back to the dumbbell). */
const CATEGORY_LOOK = {
  'قدرتی': { icon: 'dumbbell', tone: 'orange' },
  'ثبات و میان‌تنه': { icon: 'target', tone: 'violet' },
  'وزنه آزاد': { icon: 'weight', tone: 'slate' },
  HIIT: { icon: 'zap', tone: 'rose' },
  'هوازی': { icon: 'heart', tone: 'sky' },
  'موبیلیتی': { icon: 'stretch', tone: 'green' },
};

const unread = (db, user) => getNotifications(db, user.id).filter((n) => !n.read).length;

const common = (db, user) => ({
  notifications: { id: 'notifications', icon: 'bell', tone: 'amber', label: 'svc.notifications', badge: count(unread(db, user)), action: { type: 'modal', modal: { type: 'notifications' } } },
  settings: { id: 'settings', icon: 'settings', tone: 'slate', label: 'svc.settings', action: page('settings') },
  guide: { id: 'guide', icon: 'help', tone: 'blue', label: 'svc.guide', action: { type: 'onboarding' } },
});

function athleteServices(db, user) {
  const library = getAthleteLibrary(db, user.id);
  const waiting = library.awaitingPayment.length + library.pending.length;
  const shared = common(db, user);
  const categories = [...new Set(db.exercises.map((e) => e.cat))];
  return {
    main: [
      { id: 'trainers', icon: 'search', tone: 'orange', label: 'svc.trainers', action: page('trainers') },
      { id: 'programs', icon: 'calendar', tone: 'blue', label: 'svc.programs', badge: count(waiting), action: page('programs') },
      { id: 'exercises', icon: 'dumbbell', tone: 'violet', label: 'svc.exercises', action: page('exercises') },
      { id: 'nutrition', icon: 'food', tone: 'green', label: 'svc.nutrition', action: page('nutrition') },
    ],
    groups: [
      {
        id: 'tools',
        title: 'svc.group.athlete',
        items: [
          { id: 'progress', icon: 'chart', tone: 'sky', label: 'svc.progress', action: page('progress') },
          { id: 'body', icon: 'body', tone: 'rose', label: 'svc.body', action: page('profile') },
          { id: 'featured', icon: 'crown', tone: 'amber', label: 'svc.featured', badge: word('svc.badge.featured'), action: page('trainers', { premiumOnly: true }) },
          user.province && { id: 'nearby', icon: 'pin', tone: 'green', label: 'svc.nearby', action: page('trainers', { province: user.province }) },
          shared.notifications,
          shared.settings,
          shared.guide,
        ].filter(Boolean),
      },
      {
        id: 'moves',
        title: 'svc.group.moves',
        items: categories.map((cat) => ({
          id: `cat-${cat}`, ...(CATEGORY_LOOK[cat] ?? { icon: 'dumbbell', tone: 'orange' }), label: `cat.${cat}`, action: page('exercises', { category: cat }),
        })),
      },
    ],
  };
}

function trainerServices(db, user) {
  const clients = getTrainerClients(db, user.id);
  const shared = common(db, user);
  return {
    main: [
      { id: 'clients', icon: 'users', tone: 'orange', label: 'svc.clients', badge: count(clients.pending.length), action: page('clients') },
      { id: 'programs', icon: 'calendar', tone: 'blue', label: 'svc.programs.trainer', action: page('programs') },
      { id: 'insights', icon: 'chart', tone: 'green', label: 'svc.insights', action: page('insights') },
      { id: 'premium', icon: 'crown', tone: 'amber', label: 'svc.premium', badge: isPremium(user) ? null : word('svc.badge.deal'), action: page('premium') },
    ],
    groups: [
      {
        id: 'tools',
        title: 'svc.group.trainer',
        items: [
          { id: 'new-program', icon: 'plus', tone: 'violet', label: 'svc.newProgram', badge: word('svc.badge.new'), action: { type: 'editor' } },
          { id: 'profile', icon: 'user', tone: 'rose', label: 'svc.myProfile', action: page('profile') },
          { id: 'share', icon: 'share', tone: 'sky', label: 'svc.shareProfile', action: { type: 'modal', modal: { type: 'share', kind: 'trainer', id: user.id } } },
          { id: 'exercises', icon: 'dumbbell', tone: 'slate', label: 'svc.exercises', action: page('exercises') },
          { id: 'trainers', icon: 'search', tone: 'orange', label: 'svc.trainers.trainer', action: page('trainers') },
          user.isAdmin && { id: 'admin', icon: 'shield', tone: 'slate', label: 'svc.admin', action: page('admin') },
          shared.notifications,
          shared.settings,
          shared.guide,
        ].filter(Boolean),
      },
    ],
  };
}

/** { main: [tile], groups: [{ id, title, items: [tile] }] } for the signed-in person's home screen. */
export const homeServices = (db, user) => (user.role === 'coach' ? trainerServices(db, user) : athleteServices(db, user));
