// Shared constants: storage keys, status vocabularies, option lists.

export const STORAGE_KEY = 'jimato:state:v6';
export const PREVIOUS_STORAGE_KEY = 'jimato:state:v5'; // marketplace without sign-in
export const LEGACY_STORAGE_KEY = 'jimato:state:v4';
export const ONBOARDING_KEY = 'jimato:onboarding:v2';
/** The interface tour that follows the first-run story: absent = never decided, 'pending' = show it, 'done' = seen. */
export const TOUR_KEY = 'jimato:tour:v1';
export const STATE_VERSION = 6;
/** Bumped when the starter exercises / programs grow; saves from an older release get the new ones added (see withDefaults). */
export const SEED_RELEASE = 4;

export const DEFAULT_FREE_WORKOUT = ['pushup', 'squat'];
export const DAY_MS = 86400000;

// Starter accounts the onboarding screen can jump into (admins only; see Onboarding).
export const DEMO_ACCOUNTS = { trainer: 'adel', athlete: 'ashkan' };

export const MILESTONES = [50, 100, 250, 500, 1000, 2500, 5000, 10000];

// Option ids. Labels live in the i18n dictionaries (`goal.<id>`, `muscle.<id>`, `level.<id>`).
export const GOALS = ['fatloss', 'muscle', 'strength', 'fitness', 'endurance', 'mobility'];
export const MUSCLES = ['abs', 'chest', 'back', 'shoulders', 'arms', 'thighs', 'glutes', 'fullbody'];
export const LEVELS = ['beginner', 'intermediate', 'advanced'];
/** Trainer specialties and program focus areas are drawn from both lists. */
export const FOCUS_AREAS = [...GOALS, ...MUSCLES];

// ---- Independent lifecycles. Each one is modelled on its own (never merged into one "status"). ----
export const PROGRAM_KIND = { GENERAL: 'general', CUSTOM: 'custom' };
export const PROGRAM_STATUS = { DRAFT: 'draft', PUBLISHED: 'published' };
export const REQUEST_STATUS = { PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', CANCELLED: 'cancelled' };
export const PAYMENT_STATUS = { PENDING: 'pending', PAID: 'paid', FAILED: 'failed', CANCELLED: 'cancelled' };
export const PAYMENT_KIND = { GENERAL: 'general_purchase', COACHING: 'coaching_initial', RENEWAL: 'coaching_renewal', PREMIUM: 'premium_subscription' };

/**
 * Premium ("ویژه") for trainers: a monthly subscription that puts the trainer in the featured group at the top of the
 * list of their province, with a distinct card. `price` is what is charged (the payment server must use the same
 * figure); `listPrice` is only the struck-through "before" price shown next to it.
 */
export const PREMIUM = { price: 90000, listPrice: 200000, days: 30, renewWindowDays: 7 };
/** Platform settings the admin can change (db.settings). `commissionRate`: percent the platform keeps of coaching and program sales (shown as an estimate in the admin panel). */
export const DEFAULT_SETTINGS = { commissionRate: 10 };
export const SUBSCRIPTION_STATUS = { PENDING: 'pending_payment', ACTIVE: 'active', EXPIRED: 'expired', CANCELLED: 'cancelled' };

/** What an athlete sees for one coaching relationship; derived by requestPhase(). */
export const PHASE = {
  PENDING: 'pending',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  PREPARING: 'preparing',
  AWAITING_PAYMENT: 'awaiting_payment',
  ACTIVE: 'active',
  EXPIRED: 'expired',
};

export const PHOTO_MAX_SIDE = 720;
