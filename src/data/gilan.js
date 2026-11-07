// Sample trainers for Gilan: 19 more (with the existing "neda" that makes 20), five of them with an active Premium
// subscription. They exist so the Premium ranking can be seen at work with a believable spread: some premium trainers
// score very high, one premium trainer scores below a few free ones (premium decides the group, the score decides the
// order inside it), and some trainers are brand new. Everything is generated from fixed numbers, so it is identical on
// every device. None of these people has an account.
import { DAY_MS } from '../lib/constants.js';
import { generalProgram } from './community.js';

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

/** Small deterministic random generator (mulberry32), so the sample data never changes between loads. */
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['نیکا', 'آرمان', 'سپیده', 'کیارش', 'یگانه', 'امید', 'نرگس', 'دانیال', 'روشنک', 'سینا', 'پگاه', 'مانی', 'ترگل', 'آیدین', 'فرزانه', 'بهراد', 'شبنم', 'میلاد'];

/** Athletes who liked, reviewed and bought (no accounts). 28 of them, so a top trainer can have a long list. */
export const gilanAthletes = NAMES.map((name, i) => ({
  id: `demo-g${i + 1}`,
  name,
  publicId: `JM-DG${String(i + 1).padStart(4, '0')}`,
  role: 'athlete',
  roles: ['athlete'],
  demo: true,
}));

// id, name, city, specialties, years, coaching, premium?, quality (0..1), program price
const TRAINERS = [
  ['aryan', 'آرین', 'rasht-c', ['strength', 'muscle', 'chest'], 9, true, true, 1, 450000],
  ['negar', 'نگار', 'rasht-c', ['fatloss', 'fullbody', 'glutes'], 6, true, true, 0.9, 320000],
  ['parsa', 'پارسا', 'anzali', ['endurance', 'fitness', 'fatloss'], 8, true, true, 0.8, 250000],
  ['setayesh', 'ستایش', 'lahijan', ['mobility', 'fitness'], 5, true, true, 0.68, 180000],
  ['mehrdad', 'مهرداد', 'rasht-c', ['abs', 'fatloss', 'strength'], 11, true, true, 0.42, 390000],
  ['ghazal', 'غزل', 'rasht-c', ['thighs', 'glutes', 'fitness'], 7, true, false, 0.88, 290000],
  ['soheil', 'سهیل', 'langarud', ['muscle', 'back', 'strength'], 10, true, false, 0.74, 350000],
  ['raha', 'رها', 'rudsar', ['fitness', 'mobility'], 4, false, false, 0.62, 0],
  ['amirhossein', 'امیرحسین', 'astara', ['strength', 'fullbody'], 6, true, false, 0.64, 270000],
  ['parisa', 'پریسا', 'fuman', ['fatloss', 'fitness'], 5, true, false, 0.5, 220000],
  ['behnam', 'بهنام', 'somesara', ['endurance', 'fitness'], 8, false, false, 0.46, 150000],
  ['mina', 'مینا', 'anzali', ['abs', 'fitness'], 3, true, false, 0.55, 199000],
  ['kaveh', 'کاوه', 'talesh', ['muscle', 'chest'], 5, true, false, 0.36, 310000],
  ['elnaz', 'الناز', 'lahijan', ['glutes', 'thighs'], 4, true, false, 0.4, 240000],
  ['yasin', 'یاسین', 'rezvanshahr', ['strength', 'back'], 2, false, false, 0.28, 0],
  ['hasti', 'هستی', 'rasht-c', ['fullbody', 'fitness'], 3, true, false, 0.22, 120000],
  ['farhad', 'فرهاد', 'amlash', ['endurance'], 12, false, false, 0.14, 99000],
  ['nazanin', 'نازنین', 'siahkal', ['mobility', 'fatloss'], 1, true, false, 0.08, 0],
  ['saman', 'سامان', 'masal', ['fitness'], 1, false, false, 0.03, 0],
];

const BIOS = [
  'مربی با تمرکز روی پیشرفت تدریجی و فرم درست حرکت؛ برنامه‌هایم ساده و قابل‌اجرا در باشگاه و خانه هستند.',
  'همراه تو از اولین جلسه تا رسیدن به هدف؛ تمرین، تغذیه ساده و پیگیری منظم.',
  'برنامه‌ها را بر اساس سطح و زمان آزاد خودت تنظیم می‌کنم، نه یک نسخه برای همه.',
  'سال‌ها کار با مبتدی‌ها و کسانی که بعد از وقفه برمی‌گردند؛ صبور و دقیق.',
];
const COMMENTS = [
  'برنامه منظم و قابل اجراست، بعد از چند هفته تفاوت رو حس کردم.',
  'توضیح حرکت‌ها واضح بود و جواب پیام‌ها رو سریع می‌داد.',
  'ارزش پولش رو داشت.',
  'برای مبتدی‌ها خیلی مناسبه.',
  'کمی سنگین بود ولی نتیجه داد.',
  'ممنون از پیگیری‌هاتون.',
  'خوب بود، فقط ای کاش ویدیوی بیشتری داشت.',
  'عالی؛ پیشنهاد می‌کنم.',
  'برای من که وقت کمی دارم مناسب بود.',
  'متوسط بود، انتظار بیشتری داشتم.',
];
const TEMPLATES = [
  { title: 'تمام بدن ۴ هفته‌ای', goals: ['fitness', 'fullbody'], level: 'beginner', weeks: 4, days: 3, sessions: [{ name: 'تمام بدن', items: ['squat', 'pushup', 'plank', 'lunge'] }], plan: ['squat', 'pushup', 'plank', 'lunge'] },
  { title: 'چربی‌سوزی ۶ هفته‌ای', goals: ['fatloss', 'endurance'], level: 'intermediate', weeks: 6, days: 4, sessions: [{ name: 'قلبی و شکم', items: ['jacks', 'climber', 'burpee', 'plank'] }], plan: ['jacks', 'climber', 'burpee', 'plank'] },
  { title: 'عضله‌سازی بالا‌تنه', goals: ['muscle', 'chest', 'back'], level: 'intermediate', weeks: 8, days: 4, sessions: [{ name: 'بالاتنه', items: ['pushup', 'pullup', 'dbpress', 'curl'] }], plan: ['pushup', 'pullup', 'dbpress', 'curl'] },
  { title: 'پایین‌تنه و باسن', goals: ['thighs', 'glutes'], level: 'intermediate', weeks: 6, days: 3, sessions: [{ name: 'پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }], plan: ['squat', 'lunge', 'deadlift', 'hamstring'] },
  { title: 'شکم و میان‌تنه', goals: ['abs'], level: 'beginner', weeks: 4, days: 4, sessions: [{ name: 'شکم', items: ['crunch', 'legraise', 'plank', 'twist'] }], plan: ['crunch', 'legraise', 'plank', 'twist'] },
  { title: 'تحرک و انعطاف', goals: ['mobility', 'fitness'], level: 'beginner', weeks: 3, days: 5, sessions: [{ name: 'کشش و تحرک', items: ['hamstring', 'plank', 'squat'] }], plan: ['hamstring', 'plank', 'squat'] },
];
const goalMatch = (specialties) => TEMPLATES.find((t) => t.goals.some((g) => specialties.includes(g))) ?? TEMPLATES[0];

export const gilanTrainers = TRAINERS.map(([id, name, city, specialties, years, coaching, premium, quality], i) => ({
  id: `gl-${id}`,
  name,
  publicId: `JM-GL${String(i + 1).padStart(4, '0')}`,
  role: 'coach',
  roles: ['coach'],
  demo: true,
  province: 'gilan',
  city,
  specialties,
  bio: BIOS[i % BIOS.length],
  experienceYears: years,
  offersCoaching: coaching,
  sampleAthletes: Math.round(quality * 26) + (coaching ? 2 : 0),
  ...(premium ? { premium: { since: daysAgo(12 + i * 3), until: new Date(Date.now() + 170 * DAY_MS).toISOString(), province: 'gilan', paymentId: `seed-premium-${id}` } } : {}),
}));

const programs = [];
const reviews = [];
const likes = [];

TRAINERS.forEach(([id, , , specialties, , , , quality, price], i) => {
  const rnd = random(1000 + i * 77);
  const owner = `gl-${id}`;
  const template = goalMatch(specialties);
  const programId = `gp-gl-${id}`;
  programs.push(
    generalProgram(
      {
        id: programId,
        ownerId: owner,
        title: template.title,
        description: `${template.title}؛ ${template.days} جلسه در هفته با حرکات پایه و توضیح اجرای هر حرکت.`,
        goals: template.goals,
        level: template.level,
        durationWeeks: template.weeks,
        daysPerWeek: template.days,
        price,
        notes: 'هر جلسه را با گرم کردن شروع کن و بین ست‌ها استراحت کوتاه بده.',
        safety: 'اگر دردی تیز حس کردی حرکت را متوقف کن. این برنامه جایگزین نظر پزشک نیست.',
        sessions: template.sessions,
      },
      template.plan.map((exerciseId) => ({ id: exerciseId, sets: 3, reps: 12, rest: 45 })),
    ),
  );

  // How many of the 18 sample athletes engaged, and how happy they were, follow the trainer's quality.
  const pool = [...gilanAthletes].sort(() => rnd() - 0.5);
  const reviewCount = Math.round(quality * 14);
  const likeCount = Math.round(quality * 17);
  pool.slice(0, reviewCount).forEach((person, k) => {
    const rating = Math.max(1, Math.min(5, Math.round(2.4 + quality * 2.6 + (rnd() - 0.5) * 2)));
    const days = 3 + Math.floor(rnd() * 80);
    reviews.push({
      id: `seed-gl-review-${id}-${k}`, athleteId: person.id, trainerId: owner, targetKind: 'program', targetId: programId,
      rating, text: rnd() < 0.3 ? '' : COMMENTS[Math.floor(rnd() * COMMENTS.length)], createdAt: daysAgo(days), updatedAt: daysAgo(days),
    });
  });
  pool.slice(2, 2 + likeCount).forEach((person, k) => {
    likes.push({ id: `seed-gl-like-${id}-${k}`, athleteId: person.id, programId, trainerId: owner, at: daysAgo(2 + k * 3) });
  });
});

export const gilanPrograms = programs;
export const gilanReviews = reviews;
export const gilanLikes = likes;
