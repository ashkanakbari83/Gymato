// Shared pieces for the generated sample trainers (Gilan and the other provinces): a small deterministic random
// generator, bios, review comments and program templates. Everything is fixed, so it is identical on every device.
import { DAY_MS } from '../lib/constants.js';

export const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

/** Small deterministic random generator (mulberry32), so the sample data never changes between loads. */
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BIOS = [
  'مربی با تمرکز روی پیشرفت تدریجی و فرم درست حرکت؛ برنامه‌هایم ساده و قابل‌اجرا در باشگاه و خانه هستند.',
  'همراه تو از اولین جلسه تا رسیدن به هدف؛ تمرین، تغذیه ساده و پیگیری منظم.',
  'برنامه‌ها را بر اساس سطح و زمان آزاد خودت تنظیم می‌کنم، نه یک نسخه برای همه.',
  'سال‌ها کار با مبتدی‌ها و کسانی که بعد از وقفه برمی‌گردند؛ صبور و دقیق.',
];
export const COMMENTS = [
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
export const TEMPLATES = [
  { title: 'تمام بدن ۴ هفته‌ای', goals: ['fitness', 'fullbody'], level: 'beginner', weeks: 4, days: 3, sessions: [{ name: 'تمام بدن', items: ['squat', 'pushup', 'plank', 'lunge'] }], plan: ['squat', 'pushup', 'plank', 'lunge'] },
  { title: 'چربی‌سوزی ۶ هفته‌ای', goals: ['fatloss', 'endurance'], level: 'intermediate', weeks: 6, days: 4, sessions: [{ name: 'قلبی و شکم', items: ['jacks', 'climber', 'burpee', 'plank'] }], plan: ['jacks', 'climber', 'burpee', 'plank'] },
  { title: 'عضله‌سازی بالا‌تنه', goals: ['muscle', 'chest', 'back'], level: 'intermediate', weeks: 8, days: 4, sessions: [{ name: 'بالاتنه', items: ['pushup', 'pullup', 'dbpress', 'curl'] }], plan: ['pushup', 'pullup', 'dbpress', 'curl'] },
  { title: 'پایین‌تنه و باسن', goals: ['thighs', 'glutes'], level: 'intermediate', weeks: 6, days: 3, sessions: [{ name: 'پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }], plan: ['squat', 'lunge', 'deadlift', 'hamstring'] },
  { title: 'شکم و میان‌تنه', goals: ['abs'], level: 'beginner', weeks: 4, days: 4, sessions: [{ name: 'شکم', items: ['crunch', 'legraise', 'plank', 'twist'] }], plan: ['crunch', 'legraise', 'plank', 'twist'] },
  { title: 'تحرک و انعطاف', goals: ['mobility', 'fitness'], level: 'beginner', weeks: 3, days: 5, sessions: [{ name: 'کشش و تحرک', items: ['hamstring', 'plank', 'squat'] }], plan: ['hamstring', 'plank', 'squat'] },
];
export const goalMatch = (specialties) => TEMPLATES.find((t) => t.goals.some((g) => specialties.includes(g))) ?? TEMPLATES[0];

