// Sample trainers for the other provinces (Tehran, Alborz, Isfahan, Razavi Khorasan, Fars, East Azerbaijan, Mazandaran,
// Khuzestan, Kerman), built by the same recipe as Gilan: a believable spread of quality, a few of them with an active
// Premium subscription, some new and some with no personal coaching. Names are drawn from fixed lists and everything
// uses a seeded random generator, so the data is identical on every device. None of these people has an account.
import { DAY_MS, PAYMENT_KIND, PAYMENT_STATUS, PREMIUM } from '../lib/constants.js';
import { generalProgram } from './community.js';
import { BIOS, COMMENTS, daysAgo, goalMatch, random } from './sampleKit.js';

export const FIRST_NAMES = [
  'آرش', 'سارا', 'مهدی', 'مریم', 'رضا', 'زهرا', 'علی', 'نیلوفر', 'حامد', 'الهام', 'پویا', 'ساناز', 'بابک', 'فاطمه', 'کامیار', 'شیما', 'امیر', 'سحر', 'محسن', 'ندا',
  'احسان', 'مهسا', 'وحید', 'لیلا', 'سعید', 'نسترن', 'یاشار', 'آتنا', 'شایان', 'پرنیا', 'هومن', 'بهار', 'میثم', 'نیکی', 'سجاد', 'فرناز', 'رامین', 'مینو', 'کسری', 'هانیه',
];
export const FAMILY_NAMES = [
  'احمدی', 'رضایی', 'حسینی', 'کریمی', 'موسوی', 'نوری', 'صادقی', 'جعفری', 'اکبری', 'طاهری', 'قاسمی', 'یوسفی', 'مرادی', 'رحیمی', 'عباسی', 'امینی', 'فرهادی', 'سلطانی', 'شریفی', 'هاشمی',
  'کاظمی', 'بابایی', 'ملکی', 'فلاحی', 'زارعی', 'منصوری', 'پورمحمدی', 'عزیزی', 'نجفی', 'دانشور',
];

const SPECIALTIES = ['strength', 'muscle', 'chest', 'back', 'fatloss', 'fullbody', 'glutes', 'thighs', 'abs', 'endurance', 'fitness', 'mobility'];
const PRICES = [0, 99000, 150000, 190000, 250000, 290000, 350000, 450000];

/** One entry per province: id, id prefix, trainer count, city weights (the first is the biggest), premium slots (index -> quality). */
const REGIONS = [
  { province: 'tehran', prefix: 'th', count: 12, cities: ['tehran-c', 'tehran-c', 'tehran-c', 'shahriar'], premium: { 0: 0.95, 2: 0.78, 5: 0.5, 8: 0.3 } },
  { province: 'alborz', prefix: 'al', count: 10, cities: ['karaj-c', 'karaj-c', 'fardis'], premium: { 1: 0.9, 4: 0.6, 7: 0.35 } },
  { province: 'isfahan', prefix: 'is', count: 10, cities: ['isfahan-c', 'isfahan-c', 'kashan', 'najafabad'], premium: { 0: 0.88, 3: 0.66, 6: 0.4 } },
  { province: 'razavi', prefix: 'rz', count: 10, cities: ['mashhad-c', 'mashhad-c', 'neyshabur'], premium: { 2: 0.92, 4: 0.7, 8: 0.38 } },
  { province: 'fars', prefix: 'fr', count: 10, cities: ['shiraz-c', 'shiraz-c', 'marvdasht'], premium: { 1: 0.85, 5: 0.58, 9: 0.33 } },
  { province: 'east-azerbaijan', prefix: 'ea', count: 10, cities: ['tabriz-c'], premium: { 0: 0.8, 3: 0.64, 7: 0.36 } },
  { province: 'mazandaran', prefix: 'mz', count: 10, cities: ['sari-c', 'babol', 'sari-c'], premium: { 2: 0.9, 5: 0.62, 6: 0.34 } },
  { province: 'khuzestan', prefix: 'kh', count: 8, cities: ['ahvaz-c', 'ahvaz-c', 'abadan'], premium: { 1: 0.82, 4: 0.52 } },
  { province: 'kerman', prefix: 'km', count: 8, cities: ['kerman-c'], premium: { 0: 0.76, 3: 0.44 } },
];

/** Athletes who liked and reviewed the trainers of these provinces (no accounts). */
export const regionAthletes = Array.from({ length: 40 }, (_, i) => ({
  id: `demo-r${i + 1}`,
  name: `${FIRST_NAMES[(i * 7 + 3) % FIRST_NAMES.length]} ${FAMILY_NAMES[(i * 11 + 5) % FAMILY_NAMES.length]}`,
  publicId: `JM-DR${String(i + 1).padStart(4, '0')}`,
  role: 'athlete',
  roles: ['athlete'],
  demo: true,
}));

const trainers = [];
const programs = [];
const reviews = [];
const likes = [];
const usedNames = new Set();

REGIONS.forEach(({ province, prefix, count, cities, premium }, regionIndex) => {
  const rnd = random(5000 + regionIndex * 131);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  for (let n = 0; n < count; n += 1) {
    // A name nobody else has, drawn from the two lists.
    let name;
    do name = `${pick(FIRST_NAMES)} ${pick(FAMILY_NAMES)}`; while (usedNames.has(name));
    usedNames.add(name);

    const id = `${prefix}-${n + 1}`;
    const isPremium = n in premium;
    const quality = isPremium ? premium[n] : Number((0.04 + rnd() ** 1.3 * 0.86).toFixed(2));
    const coaching = isPremium || rnd() < 0.72;
    const specialties = [...new Set([pick(SPECIALTIES), pick(SPECIALTIES), pick(SPECIALTIES)])];
    const years = 1 + Math.floor(rnd() * 14);
    const price = quality < 0.08 ? 0 : pick(PRICES);
    const owner = id;

    trainers.push({
      id: owner,
      name,
      publicId: `JM-${prefix.toUpperCase()}${String(n + 1).padStart(4, '0')}`,
      role: 'coach',
      roles: ['coach'],
      demo: true,
      province,
      city: pick(cities),
      specialties,
      bio: BIOS[(n + regionIndex) % BIOS.length],
      experienceYears: years,
      offersCoaching: coaching,
      sampleAthletes: Math.round(quality * 26) + (coaching ? 2 : 0),
      ...(isPremium ? { premium: { since: daysAgo(10 + Math.floor(rnd() * 40)), until: new Date(Date.now() + 170 * DAY_MS).toISOString(), province, paymentId: `seed-premium-${id}` } } : {}),
    });

    const template = goalMatch(specialties);
    const programId = `gp-${id}`;
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

    // How many athletes engaged and how happy they were follow the trainer's quality.
    const pool = [...regionAthletes].sort(() => rnd() - 0.5);
    const reviewCount = Math.round(quality * 12);
    const likeCount = Math.round(quality * 17);
    pool.slice(0, reviewCount).forEach((person, k) => {
      const rating = Math.max(1, Math.min(5, Math.round(2.4 + quality * 2.6 + (rnd() - 0.5) * 2)));
      const days = 3 + Math.floor(rnd() * 80);
      reviews.push({
        id: `seed-${id}-review-${k}`, athleteId: person.id, trainerId: owner, targetKind: 'program', targetId: programId,
        rating, text: rnd() < 0.3 ? '' : COMMENTS[Math.floor(rnd() * COMMENTS.length)], createdAt: daysAgo(days), updatedAt: daysAgo(days),
      });
    });
    pool.slice(2, 2 + likeCount).forEach((person, k) => {
      likes.push({ id: `seed-${id}-like-${k}`, athleteId: person.id, programId, trainerId: owner, at: daysAgo(2 + k * 3) });
    });
  }
});

export const regionTrainers = trainers;
export const regionPrograms = programs;
export const regionReviews = reviews;
export const regionLikes = likes;

/**
 * The payment behind each sample premium subscription (the trainer paid the platform; there is no trainer income),
 * so the admin panel has real premium revenue to show. Flagged `demo`.
 */
export const premiumPaymentsFor = (users) => users
  .filter((u) => u.role === 'coach' && u.premium?.paymentId?.startsWith('seed-premium-'))
  .map((u) => ({
    id: u.premium.paymentId, kind: PAYMENT_KIND.PREMIUM, athleteId: u.id, trainerId: null, targetId: u.id, amount: PREMIUM.price,
    status: PAYMENT_STATUS.PAID, gateway: 'test', gatewayRef: `seed-ref-${u.premium.paymentId}`, failureReason: null,
    createdAt: u.premium.since, updatedAt: u.premium.since, paidAt: u.premium.since, demo: true,
  }));
