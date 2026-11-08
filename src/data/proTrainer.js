// The default professional trainer ("کامران"): an admin-pickable account that opens already looking like a busy,
// established coach — a long client list (active, expired, waiting for an answer, waiting to pay), steady income from
// coaching, renewals and program sales, premium running, lots of reviews, likes and profile views. It is here so that
// the trainer screens, the income numbers and the admin panel can be seen with real-looking volume.
//
// Everything is generated from fixed numbers (seeded random generator); dates are relative to "now" so the picture is
// always current. All payments are flagged `demo` and all the people are listing-only (no account) except the trainer.
import { createCredentials } from '../lib/auth.js';
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS, PREMIUM, PROGRAM_KIND, PROGRAM_STATUS, REQUEST_STATUS, SUBSCRIPTION_STATUS } from '../lib/constants.js';
import { buildSessions } from '../lib/programs.js';
import { generalProgram } from './community.js';
import { FAMILY_NAMES, FIRST_NAMES, regionAthletes } from './regions.js';
import { COMMENTS, random } from './sampleKit.js';

export const PRO_ID = 'kamran';
const rnd = random(90210);
const pick = (list) => list[Math.floor(rnd() * list.length)];
const between = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const msAgo = (days) => Date.now() - days * DAY_MS;
const isoAgo = (days) => new Date(msAgo(days)).toISOString();

// ---- The trainer ----
const resume = [
  { id: 'seed-kamran-r1', kind: 'work', title: 'سرمربی باشگاه آلفا', place: 'تهران', year: 2016, text: 'مسئول تیم مربیان و برنامه‌ریزی تمرین اعضای ویژه.' },
  { id: 'seed-kamran-r2', kind: 'work', title: 'مربی اختصاصی', place: 'تهران', year: 2012, text: 'بیش از ۴۰۰ شاگرد آنلاین و حضوری در ده سال کار مستقل.' },
  { id: 'seed-kamran-r3', kind: 'certificate', title: 'مربی‌گری بدنسازی، سطح ۲', place: 'آکادمی ورزش', year: 2013, text: '' },
  { id: 'seed-kamran-r4', kind: 'certificate', title: 'تغذیه ورزشی', place: 'دوره‌ی تخصصی', year: 2018, text: '' },
  { id: 'seed-kamran-r5', kind: 'award', title: 'مربی برتر سال', place: 'جیماتو', year: 2025, text: 'بر اساس نظر شاگردان.' },
];

const premiumPayments = Array.from({ length: 5 }, (_, k) => {
  const days = 6 + (4 - k) * 30; // 126, 96, 66, 36, 6 days ago
  return {
    id: `seed-pro-premium-${k}`, kind: PAYMENT_KIND.PREMIUM, athleteId: PRO_ID, trainerId: null, targetId: PRO_ID, amount: PREMIUM.price,
    status: PAYMENT_STATUS.PAID, gateway: 'test', gatewayRef: `seed-ref-pro-premium-${k}`, failureReason: null,
    createdAt: isoAgo(days), updatedAt: isoAgo(days), paidAt: isoAgo(days), demo: true,
  };
});

export const proTrainer = {
  id: PRO_ID,
  name: 'کامران',
  role: 'coach',
  roles: ['coach'],
  username: 'admin',
  isAdmin: true,
  ...createCredentials('admin', `jimato-seed-${PRO_ID}`),
  publicId: 'JM-KM9P01',
  province: 'tehran',
  city: 'tehran-c',
  specialties: ['strength', 'muscle', 'fatloss', 'fullbody'],
  bio: 'مربی بدنسازی و تغذیه با ۱۴ سال سابقه. برنامه‌ی اختصاصی، پیگیری هفتگی و پاسخ‌گویی سریع؛ تا حالا بیش از ۴۰۰ نفر رو تا رسیدن به هدفشون همراهی کردم.',
  experienceYears: 14,
  offersCoaching: true,
  resume,
  premium: { since: isoAgo(126), until: new Date(msAgo(-24)).toISOString(), province: 'tehran', paymentId: 'seed-pro-premium-4' },
};

// ---- Clients ----
const GOAL_PLANS = {
  muscle: [{ name: 'روز A · بالاتنه', items: ['pushup', 'pullup', 'dbpress', 'curl'] }, { name: 'روز B · پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }],
  strength: [{ name: 'روز A · بالاتنه', items: ['pushup', 'pullup', 'dbpress', 'curl'] }, { name: 'روز B · پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }],
  fatloss: [{ name: 'روز A · قلبی', items: ['jacks', 'climber', 'burpee', 'plank'] }, { name: 'روز B · قدرتی', items: ['squat', 'lunge', 'pushup', 'crunch'] }],
  endurance: [{ name: 'روز A · قلبی', items: ['jacks', 'climber', 'burpee', 'plank'] }, { name: 'روز B · قدرتی', items: ['squat', 'lunge', 'pushup', 'crunch'] }],
  fitness: [{ name: 'تمام بدن', items: ['squat', 'pushup', 'plank', 'lunge', 'jacks'] }],
  mobility: [{ name: 'کشش و تحرک', items: ['hamstring', 'plank', 'squat'] }],
};
const TIERS = [
  { price: 1500000, renewal: 1200000 },
  { price: 2400000, renewal: 1900000 },
  { price: 3600000, renewal: 3000000 },
];
const GOALS = Object.keys(GOAL_PLANS);

// 38 running, 16 ended, 4 waiting for an answer, 2 waiting to pay, 2 declined.
const KINDS = [...Array(38).fill('active'), ...Array(16).fill('expired'), ...Array(4).fill('pending'), ...Array(2).fill('awaiting'), ...Array(2).fill('rejected')];
KINDS.sort(() => rnd() - 0.5);

export const proAthletes = KINDS.map((_, i) => {
  const female = rnd() < 0.5;
  return {
    id: `demo-p${i + 1}`,
    name: `${FIRST_NAMES[(i * 9 + 4) % FIRST_NAMES.length]} ${FAMILY_NAMES[(i * 7 + 2) % FAMILY_NAMES.length]}`,
    publicId: `JM-DP${String(i + 1).padStart(4, '0')}`,
    role: 'athlete',
    roles: ['athlete'],
    demo: true,
    age: between(19, 48),
    height: female ? between(155, 172) : between(168, 190),
    weight: female ? between(52, 82) : between(65, 105),
    goal: pick(GOALS),
    level: pick(['beginner', 'intermediate', 'advanced']),
    province: rnd() < 0.82 ? 'tehran' : 'alborz',
    city: 'tehran-c',
  };
});

export const proRequests = [];
export const proConversations = [];
export const proMessages = [];
export const proCustomPrograms = [];
export const proSubscriptions = [];
export const proPayments = [...premiumPayments];
export const proNotifications = [];

const PRO_TEXTS = [
  ['سلام، برنامه‌ات آماده‌ست. این هفته با روز A شروع کن و فرمت حرکت‌ها رو چک کن.', 'سلام مربی، ممنون! از فردا شروع می‌کنم.'],
  ['وزنت این هفته چطور بود؟ اگه خسته‌ای یه روز استراحت اضافه کن.', 'یک کیلو کم شدم، خیلی خوبه. استراحت رو هم رعایت کردم.'],
  ['فرم اسکوات رو برام فیلم بفرست، اصلاحش می‌کنیم.', 'چشم، همین امشب می‌فرستم.'],
  ['عالیه! هفته‌ی بعد وزنه‌ها رو یه پله بالاتر ببر.', 'باشه، ممنون از پیگیری‌هاتون.'],
];

KINDS.forEach((kind, i) => {
  const athlete = proAthletes[i];
  const tier = pick(TIERS);
  const requestId = `seed-pro-req-${i}`;
  const joinedAgo = kind === 'active' ? between(8, 175) : 0;
  const periods = kind === 'expired' ? between(1, 5) : kind === 'active' ? Math.floor(joinedAgo / 30) + 1 : 0;
  const endedAgo = kind === 'expired' ? between(3, 60) : 0;
  const started = kind === 'expired' ? endedAgo + periods * 30 : kind === 'active' ? joinedAgo : between(1, 9);
  const requestedAgo = started + 3;

  proRequests.push({
    id: requestId,
    athleteId: athlete.id,
    trainerId: PRO_ID,
    status: kind === 'pending' ? REQUEST_STATUS.PENDING : kind === 'rejected' ? REQUEST_STATUS.REJECTED : REQUEST_STATUS.ACCEPTED,
    form: {
      name: athlete.name, age: athlete.age, height: athlete.height, weight: athlete.weight, goal: athlete.goal, muscles: [],
      level: athlete.level, daysPerWeek: between(3, 5), wantsMealPlan: rnd() < 0.5, schedule: 'عصرها بعد از کار', notes: '', photo: '',
    },
    offer: kind === 'pending' || kind === 'rejected' ? null : { price: tier.price, renewalPrice: tier.renewal, durationDays: 30 },
    rejectionReason: kind === 'rejected' ? 'این روزها ظرفیتم پره؛ چند هفته‌ی دیگه دوباره درخواست بده.' : '',
    createdAt: isoAgo(kind === 'pending' ? between(0, 3) : requestedAgo),
    decidedAt: kind === 'pending' ? null : isoAgo(started + 2),
  });

  if (kind === 'pending') {
    proNotifications.push({ id: `seed-pro-note-req-${i}`, userId: PRO_ID, type: 'request_new', params: { athlete: athlete.name }, target: { kind: 'coaching', requestId }, read: false, createdAt: proRequests.at(-1).createdAt });
    return;
  }
  if (kind === 'rejected') return;

  const conversationId = `seed-pro-conv-${i}`;
  proConversations.push({ id: conversationId, requestId, athleteId: athlete.id, trainerId: PRO_ID, createdAt: isoAgo(started + 2) });
  const sys = (key, days, n) => proMessages.push({ id: `seed-pro-msg-${i}-sys-${n}`, conversationId, kind: 'system', systemKey: key, createdAt: isoAgo(days) });
  sys('chat.sys.accepted', started + 2, 0);

  const sessions = GOAL_PLANS[athlete.goal];
  const exercises = [...new Set(sessions.flatMap((s) => s.items))];
  const programId = `seed-pro-cp-${i}`;
  proCustomPrograms.push({
    id: programId, kind: PROGRAM_KIND.CUSTOM, requestId, trainerId: PRO_ID, athleteId: athlete.id,
    title: `برنامه‌ی اختصاصی ${athlete.name}`, notes: 'هفته‌ای یک‌بار وزن و عکس بفرست تا برنامه رو به‌روز کنم.', safety: 'اگر دردی تیز حس کردی حرکت را متوقف کن.',
    mealPlan: null, daysPerWeek: 4, durationWeeks: 8, exercises,
    targets: Object.fromEntries(exercises.map((id) => [id, { sets: 3, reps: 12, rest: 60 }])),
    sessions: buildSessions(sessions, exercises), status: PROGRAM_STATUS.PUBLISHED, version: 1 + (periods > 2 ? 1 : 0),
    createdAt: isoAgo(started + 1), updatedAt: isoAgo(Math.max(1, started - 5)),
  });

  const subscriptionId = `seed-pro-sub-${i}`;
  if (kind === 'awaiting') {
    proSubscriptions.push({ id: subscriptionId, requestId, athleteId: athlete.id, trainerId: PRO_ID, customProgramId: programId, status: SUBSCRIPTION_STATUS.PENDING, price: tier.price, renewalPrice: tier.renewal, durationDays: 30, startAt: null, endAt: null, paymentIds: [], renewalCount: 0, createdAt: isoAgo(started) });
    return;
  }

  // Paid periods: the first at `started` days ago, then one every 30 days.
  const paymentIds = [];
  for (let k = 0; k < periods; k += 1) {
    const paidAgo = started - k * 30;
    const id = `seed-pro-pay-${i}-${k}`;
    paymentIds.push(id);
    proPayments.push({
      id, kind: k === 0 ? PAYMENT_KIND.COACHING : PAYMENT_KIND.RENEWAL, athleteId: athlete.id, trainerId: PRO_ID, targetId: subscriptionId,
      amount: k === 0 ? tier.price : tier.renewal, status: PAYMENT_STATUS.PAID, gateway: 'test', gatewayRef: `seed-ref-${id}`, failureReason: null,
      createdAt: isoAgo(paidAgo), updatedAt: isoAgo(paidAgo), paidAt: isoAgo(paidAgo), demo: true,
    });
    sys(k === 0 ? 'chat.sys.active' : 'chat.sys.renewed', paidAgo, k + 1);
  }
  const startAgo = started - (periods - 1) * 30;
  proSubscriptions.push({
    id: subscriptionId, requestId, athleteId: athlete.id, trainerId: PRO_ID, customProgramId: programId, status: SUBSCRIPTION_STATUS.ACTIVE,
    price: tier.price, renewalPrice: tier.renewal, durationDays: 30, startAt: msAgo(startAgo), endAt: msAgo(startAgo - 30), paymentIds, renewalCount: periods - 1, createdAt: isoAgo(started),
  });

  // Some conversations have real talk in them.
  if (kind === 'active' && i % 3 === 0) {
    const [a, b] = PRO_TEXTS[i % PRO_TEXTS.length];
    proMessages.push(
      { id: `seed-pro-msg-${i}-t1`, conversationId, kind: 'text', senderId: PRO_ID, text: a, createdAt: isoAgo(Math.max(0.2, startAgo - 1)) },
      { id: `seed-pro-msg-${i}-t2`, conversationId, kind: 'text', senderId: athlete.id, text: b, createdAt: isoAgo(Math.max(0.1, startAgo - 1.2)) },
    );
  }
});

// A few recent notes for the trainer.
const lastRenewals = proPayments.filter((p) => p.kind === PAYMENT_KIND.RENEWAL).sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 4);
lastRenewals.forEach((p, k) => proNotifications.push({
  id: `seed-pro-note-ren-${k}`, userId: PRO_ID, type: 'subscription_renewed', params: { athlete: proAthletes.find((a) => a.id === p.athleteId).name },
  target: { kind: 'coaching', requestId: proSubscriptions.find((s) => s.id === p.targetId).requestId }, read: k > 1, createdAt: p.paidAt,
}));

// ---- General programs and their sales ----
const GENERAL = [
  ['gp-kamran-mass', 'عضله‌سازی ۱۲ هفته‌ای حرفه‌ای', ['muscle', 'strength'], 'advanced', 12, 5, 1290000, [{ name: 'پوش', items: ['pushup', 'dbpress', 'curl'] }, { name: 'پول', items: ['pullup', 'deadlift'] }, { name: 'پا', items: ['squat', 'lunge', 'hamstring'] }]],
  ['gp-kamran-cut', 'خشک‌کردن ۸ هفته‌ای', ['fatloss', 'abs'], 'intermediate', 8, 5, 890000, [{ name: 'قلبی و شکم', items: ['jacks', 'climber', 'burpee', 'crunch', 'plank'] }]],
  ['gp-kamran-start', 'شروع از صفر؛ مبتدی تا متوسط', ['fitness', 'fullbody'], 'beginner', 6, 3, 390000, [{ name: 'تمام بدن', items: ['squat', 'pushup', 'plank', 'lunge'] }]],
  ['gp-kamran-free', 'گرم‌کردن و کشش روزانه (رایگان)', ['mobility'], 'beginner', 2, 7, 0, [{ name: 'کشش', items: ['hamstring', 'plank', 'squat'] }]],
  ['gp-kamran-glutes', 'باسن و پایین‌تنه', ['glutes', 'thighs'], 'intermediate', 6, 4, 590000, [{ name: 'پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }]],
  ['gp-kamran-home', 'تمرین خانگی بدون وسیله', ['fitness', 'fatloss'], 'beginner', 4, 4, 450000, [{ name: 'خانگی', items: ['pushup', 'squat', 'crunch', 'jacks'] }]],
];
export const proPrograms = GENERAL.map(([id, title, goals, level, weeks, days, price, sessions]) => generalProgram(
  {
    id, ownerId: PRO_ID, title, description: `${title}؛ برنامه‌ی کامل با توضیح اجرا و پیشرفت هفتگی.`, goals, level, durationWeeks: weeks, daysPerWeek: days, price,
    notes: 'هر جلسه با گرم‌کردن شروع شود و بین ست‌ها استراحت کامل بدهید.', safety: 'اگر دردی تیز حس کردید حرکت را متوقف کنید. جایگزین نظر پزشک نیست.', sessions,
  },
  [...new Set(sessions.flatMap((s) => s.items))].map((exerciseId) => ({ id: exerciseId, sets: 3, reps: 12, rest: 60 })),
));

const buyers = [...proAthletes, ...regionAthletes];
const weights = { 'gp-kamran-mass': 30, 'gp-kamran-cut': 26, 'gp-kamran-start': 40, 'gp-kamran-glutes': 18, 'gp-kamran-home': 22 };
Object.entries(weights).forEach(([programId, count]) => {
  const program = proPrograms.find((p) => p.id === programId);
  [...buyers].sort(() => rnd() - 0.5).slice(0, count).forEach((buyer, k) => {
    const paidAgo = Math.floor(rnd() ** 1.4 * 180) + 1;
    proPayments.push({
      id: `seed-pro-buy-${programId}-${k}`, kind: PAYMENT_KIND.GENERAL, athleteId: buyer.id, trainerId: PRO_ID, targetId: programId, amount: program.price,
      status: PAYMENT_STATUS.PAID, gateway: 'test', gatewayRef: `seed-ref-buy-${programId}-${k}`, failureReason: null,
      createdAt: isoAgo(paidAgo), updatedAt: isoAgo(paidAgo), paidAt: isoAgo(paidAgo), demo: true,
    });
  });
});
proPayments.filter((p) => p.kind === PAYMENT_KIND.GENERAL).slice(-3).forEach((p, k) => proNotifications.push({
  id: `seed-pro-note-buy-${k}`, userId: PRO_ID, type: 'purchase', params: { athlete: buyers.find((b) => b.id === p.athleteId).name, program: proPrograms.find((x) => x.id === p.targetId).title },
  target: { kind: 'page', page: 'programs' }, read: true, createdAt: p.paidAt,
}));

// ---- Reviews, likes and views ----
const rating = () => { const r = rnd(); return r < 0.78 ? 5 : r < 0.97 ? 4 : 3; };
export const proReviews = [];
Object.keys(weights).forEach((programId) => {
  const buyersOf = proPayments.filter((p) => p.targetId === programId).map((p) => p.athleteId);
  buyersOf.slice(0, 7).forEach((athleteId, k) => {
    const days = between(2, 150);
    proReviews.push({ id: `seed-pro-review-${programId}-${k}`, athleteId, trainerId: PRO_ID, targetKind: 'program', targetId: programId, rating: rating(), text: rnd() < 0.4 ? '' : pick(COMMENTS.filter((c) => !c.startsWith('متوسط'))), createdAt: isoAgo(days), updatedAt: isoAgo(days) });
  });
});
proRequests.filter((r) => r.status === REQUEST_STATUS.ACCEPTED).slice(0, 12).forEach((request, k) => {
  const days = between(2, 120);
  proReviews.push({ id: `seed-pro-review-coaching-${k}`, athleteId: request.athleteId, trainerId: PRO_ID, targetKind: 'coaching', targetId: request.id, rating: rating(), text: pick(['تو سه ماه کلی پیشرفت کردم؛ پیگیری‌هاش عالیه.', 'برنامه دقیقاً مال خودم بود و جواب پیام‌ها همیشه سریع.', 'ارزش هر تومانش رو داشت.', 'حرفه‌ای و صبور.']), createdAt: isoAgo(days), updatedAt: isoAgo(days) });
});

export const proLikes = [];
GENERAL.filter(([, , , , , , price]) => price >= 0).forEach(([programId], gi) => {
  [...buyers].sort(() => rnd() - 0.5).slice(0, 12 - gi).forEach((person, k) => proLikes.push({ id: `seed-pro-like-${programId}-${k}`, athleteId: person.id, programId, trainerId: PRO_ID, at: isoAgo(between(1, 120)) }));
});

export const proEvents = [];
const viewers = [...proAthletes, ...regionAthletes];
for (let n = 0; n < 420; n += 1) {
  const days = rnd() ** 1.6 * 60;
  const onProfile = rnd() < 0.55;
  const targetId = onProfile ? PRO_ID : pick(GENERAL)[0];
  proEvents.push({ id: `seed-pro-ev-${n}`, type: 'view', targetKind: onProfile ? 'trainer' : 'program', targetId, trainerId: PRO_ID, userId: pick(viewers).id, at: isoAgo(days) });
}
