// Sample community shown in "Trainers": extra trainers, their programs, and athletes who liked and reviewed them.
// None of these people have an account (no username / password), so they never appear in sign-in or the
// admin account switcher. They exist so the marketplace looks lived-in and covers the different cases:
//   - a trainer with great, mixed and critical reviews         (kian, reza, elham)
//   - a trainer who does not offer personal coaching           (maryam, elham)
//   - a brand-new trainer with no programs and no reviews      (neda)
//   - a trainer with only free programs and no location / bio  (hamed)
//   - free, cheap and expensive programs, a draft, a program with no description
import { DAY_MS, PROGRAM_KIND, PROGRAM_STATUS } from '../lib/constants.js';
import { buildSessions } from '../lib/programs.js';

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS).toISOString();

/** Builds a general program; `plan` is [{ id, sets, reps, rest }]. */
export const generalProgram = (fields, plan) => {
  const exerciseIds = plan.map((item) => item.id);
  return {
    kind: PROGRAM_KIND.GENERAL,
    status: PROGRAM_STATUS.PUBLISHED,
    exercises: exerciseIds,
    targets: Object.fromEntries(plan.map(({ id, sets, reps, rest }) => [id, { sets, reps, rest }])),
    sessions: buildSessions(fields.sessions, exerciseIds),
    createdAt: daysAgo(60),
    updatedAt: daysAgo(10),
    ...fields,
  };
};

const trainer = (fields) => ({ role: 'coach', roles: ['coach'], demo: true, ...fields });
const athlete = (fields) => ({ role: 'athlete', roles: ['athlete'], demo: true, ...fields });

export const communityTrainers = [
  trainer({
    id: 'kian',
    name: 'کیان',
    publicId: 'JM-KN5C82',
    province: 'isfahan',
    city: 'isfahan-c',
    specialties: ['muscle', 'chest', 'back'],
    bio: 'مربی بدنسازی؛ برنامه‌های عضله‌سازی برای مبتدی تا متوسط.',
    experienceYears: 7,
    offersCoaching: true,
  }),
  trainer({
    id: 'maryam',
    name: 'مریم',
    publicId: 'JM-MR9T40',
    province: 'fars',
    city: 'shiraz-c',
    specialties: ['thighs', 'glutes', 'fitness'],
    bio: 'مربی تناسب اندام؛ فقط برنامه‌های آماده منتشر می‌کند.',
    experienceYears: 5,
    offersCoaching: false,
  }),
  trainer({
    id: 'reza',
    name: 'رضا',
    publicId: 'JM-RZ8Q15',
    province: 'razavi',
    city: 'mashhad-c',
    specialties: ['strength', 'muscle', 'fullbody', 'back'],
    bio: 'مربی قدرتی و پاوربیلدینگ، دارای ۱۵ سال سابقه‌ی مربیگری و مشاوره‌ی ورزشکاران حرفه‌ای. برنامه‌هایم برای کسانی است که مبتدی نیستند و می‌خواهند از سقف فعلی‌شان عبور کنند؛ همه‌چیز براساس پیشرفت تدریجی بار و ثبت دقیق تمرین است.',
    experienceYears: 15,
    offersCoaching: true,
  }),
  trainer({
    id: 'sara',
    name: 'سارا',
    publicId: 'JM-SR3L66',
    province: 'east-azerbaijan',
    city: 'tabriz-c',
    specialties: ['mobility', 'fitness', 'endurance'],
    bio: 'مربی انعطاف و تحرک‌پذیری؛ مناسب کارمندان پشت‌میزنشین و بانوانی که تازه شروع کرده‌اند.',
    experienceYears: 6,
    offersCoaching: true,
  }),
  trainer({
    id: 'neda',
    name: 'ندا',
    publicId: 'JM-ND6W07',
    province: 'gilan',
    city: 'rasht-c',
    specialties: ['fitness', 'fatloss'],
    bio: 'تازه به جیماتو پیوسته‌ام؛ به‌زودی برنامه‌های عمومی منتشر می‌کنم. فعلاً فقط مربی‌گری اختصاصی.',
    experienceYears: 2,
    offersCoaching: true,
  }),
  trainer({
    id: 'hamed',
    name: 'حامد',
    publicId: 'JM-HM1X93',
    province: '',
    city: '',
    specialties: ['endurance'],
    bio: '',
    experienceYears: 0,
    offersCoaching: false,
  }),
  trainer({
    id: 'elham',
    name: 'الهام',
    publicId: 'JM-EL4P58',
    province: 'alborz',
    city: 'fardis',
    specialties: ['fatloss', 'fullbody', 'glutes'],
    bio: 'مربی چربی‌سوزی و تناسب اندام با رویکرد تمرین‌های ترکیبی.',
    experienceYears: 4,
    offersCoaching: false,
  }),
];

/** Athletes who left reviews and likes (no accounts). */
export const communityAthletes = [
  ['niloofar', 'نیلوفر'],
  ['pouria', 'پوریا'],
  ['mahsa', 'مهسا'],
  ['kamran', 'کامران'],
  ['taraneh', 'ترانه'],
  ['ali', 'علی'],
  ['zohreh', 'زهره'],
  ['babak', 'بابک'],
  ['mahan', 'ماهان'],
  ['shima', 'شیما'],
].map(([key, name], i) => athlete({ id: `demo-${key}`, name, publicId: `JM-DM${String(i + 1).padStart(4, '0')}` }));

/** Programs of the sample trainers (the three original ones are added in seed.js). */
export const communityPrograms = [
  generalProgram(
    {
      id: 'gp-kian-push-pull',
      ownerId: 'kian',
      title: 'پوش و پول؛ عضله‌سازی ۸ هفته‌ای',
      description: 'تقسیم‌بندی پوش/پول برای کسانی که چند ماه تمرین کرده‌اند و می‌خواهند حجم و قدرت را با هم بالا ببرند. هر هفته چهار جلسه.',
      goals: ['muscle', 'chest', 'back'],
      level: 'intermediate',
      durationWeeks: 8,
      daysPerWeek: 4,
      price: 390000,
      notes: 'هر هفته ۲/۵ تا ۵ درصد به وزنه‌ها اضافه کن؛ اگر فرم حرکت به هم ریخت، وزنه را کم کن.',
      safety: 'قبل از شروع ۵ تا ۱۰ دقیقه گرم کن و با وزنه‌ی سنگین بدون هم‌تمرین تمرین نکن.',
      sessions: [
        { name: 'روز A · پوش (سینه و شانه)', items: ['pushup', 'dbpress', 'plank'] },
        { name: 'روز B · پول (پشت و جلو بازو)', items: ['pullup', 'curl', 'deadlift'] },
      ],
    },
    [
      { id: 'pushup', sets: 4, reps: 12, rest: 60 },
      { id: 'dbpress', sets: 4, reps: 10, rest: 75 },
      { id: 'plank', sets: 3, reps: 45, rest: 45 },
      { id: 'pullup', sets: 4, reps: 6, rest: 90 },
      { id: 'curl', sets: 3, reps: 12, rest: 60 },
      { id: 'deadlift', sets: 3, reps: 6, rest: 120 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-maryam-glute-draft',
      ownerId: 'maryam',
      status: PROGRAM_STATUS.DRAFT,
      title: 'باسن و پایین‌تنه (در حال آماده‌سازی)',
      description: 'پیش‌نویس؛ هنوز منتشر نشده است.',
      goals: ['glutes', 'thighs'],
      level: 'beginner',
      durationWeeks: 4,
      daysPerWeek: 3,
      price: 150000,
      notes: '',
      safety: '',
      sessions: [{ name: 'باسن', items: ['squat', 'lunge'] }],
    },
    [
      { id: 'squat', sets: 3, reps: 15, rest: 45 },
      { id: 'lunge', sets: 3, reps: 12, rest: 45 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-reza-powerbuilding',
      ownerId: 'reza',
      title: 'پاوربیلدینگ پیشرفته ۱۲ هفته‌ای',
      description:
        'ترکیب تمرین‌های قدرتی سنگین و حجمی برای کسانی که حداقل دو سال تمرین منظم با وزنه دارند. پیشرفت هفتگی بار، هفته‌های سبک (دیلود) در هفته‌ی ۴ و ۸ و ثبت دقیق ست‌ها در برنامه. اگر مبتدی هستی سراغ برنامه‌های ساده‌تر برو.',
      goals: ['strength', 'muscle', 'fullbody'],
      level: 'advanced',
      durationWeeks: 12,
      daysPerWeek: 5,
      price: 1250000,
      notes: 'خواب ۷ تا ۸ ساعت و پروتئین کافی برای نتیجه گرفتن ضروری است.',
      safety: 'برای ددلیفت و اسکوات سنگین حتماً از هم‌تمرین یا نگهدارنده استفاده کن.',
      sessions: [
        { name: 'روز ۱ · قدرت پایین‌تنه', items: ['squat', 'deadlift'] },
        { name: 'روز ۲ · قدرت بالاتنه', items: ['pullup', 'dbpress', 'curl'] },
      ],
    },
    [
      { id: 'squat', sets: 5, reps: 5, rest: 150 },
      { id: 'deadlift', sets: 4, reps: 5, rest: 180 },
      { id: 'pullup', sets: 5, reps: 8, rest: 120 },
      { id: 'dbpress', sets: 4, reps: 8, rest: 120 },
      { id: 'curl', sets: 3, reps: 12, rest: 60 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-sara-mobility',
      ownerId: 'sara',
      title: 'انعطاف و تحرک؛ ۲۱ روز',
      description: 'کشش و تحرک‌پذیری برای کمر، لگن و پشت پا؛ مناسب کسانی که ساعت‌ها پشت میز می‌نشینند.',
      goals: ['mobility', 'fitness'],
      level: 'beginner',
      durationWeeks: 3,
      daysPerWeek: 6,
      price: 190000,
      notes: 'ترجیحاً صبح یا قبل از خواب انجام بده و نفس عمیق را فراموش نکن.',
      safety: 'کشش نباید دردناک باشد؛ تا مرز احساس کشیدگی برو.',
      sessions: [{ name: 'تحرک روزانه', items: ['hamstring', 'plank', 'lunge', 'squat'] }],
    },
    [
      { id: 'hamstring', sets: 3, reps: 30, rest: 15 },
      { id: 'plank', sets: 2, reps: 30, rest: 30 },
      { id: 'lunge', sets: 2, reps: 10, rest: 30 },
      { id: 'squat', sets: 2, reps: 12, rest: 30 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-sara-morning',
      ownerId: 'sara',
      title: 'صبحگاهی ۱۰ دقیقه‌ای',
      description: 'یک برنامه‌ی کوتاه و رایگان برای بیدار شدن بدن؛ برای روزهایی که وقت کم داری.',
      goals: ['fitness', 'endurance'],
      level: 'beginner',
      durationWeeks: 2,
      daysPerWeek: 7,
      price: 0,
      notes: '',
      safety: 'اگر سرگیجه گرفتی بنشین و آب بنوش.',
      sessions: [{ name: 'صبحگاهی', items: ['jacks', 'squat', 'plank', 'climber'] }],
    },
    [
      { id: 'jacks', sets: 2, reps: 30, rest: 20 },
      { id: 'squat', sets: 2, reps: 12, rest: 20 },
      { id: 'plank', sets: 2, reps: 20, rest: 20 },
      { id: 'climber', sets: 2, reps: 20, rest: 20 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-hamed-home-cardio',
      ownerId: 'hamed',
      title: 'کاردیوی خانگی بدون وسیله',
      description: '',
      goals: ['endurance', 'fatloss'],
      level: 'beginner',
      durationWeeks: 4,
      daysPerWeek: 4,
      price: 0,
      notes: '',
      safety: '',
      sessions: [{ name: 'کاردیو', items: ['jacks', 'burpee', 'climber', 'squat'] }],
    },
    [
      { id: 'jacks', sets: 3, reps: 40, rest: 30 },
      { id: 'burpee', sets: 3, reps: 8, rest: 45 },
      { id: 'climber', sets: 3, reps: 30, rest: 30 },
      { id: 'squat', sets: 3, reps: 15, rest: 30 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-elham-fatburn',
      ownerId: 'elham',
      title: 'چربی‌سوزی ۶ هفته‌ای',
      description: 'تمرین‌های ترکیبی و پرانرژی برای افزایش مصرف کالری. حرکات پرشی دارد و برای افراد با مشکل زانو توصیه نمی‌شود.',
      goals: ['fatloss', 'fullbody'],
      level: 'intermediate',
      durationWeeks: 6,
      daysPerWeek: 5,
      price: 750000,
      notes: 'هفته‌ی چهارم فشرده‌تر است؛ برنامه‌ی خواب و تغذیه‌ات را از قبل تنظیم کن.',
      safety: 'در صورت درد زانو یا کمر، حرکات پرشی را با نسخه‌ی ساده‌تر جایگزین کن.',
      sessions: [
        { name: 'روز A · ترکیبی', items: ['burpee', 'jacks', 'squat'] },
        { name: 'روز B · پایین‌تنه و شکم', items: ['lunge', 'climber', 'crunch'] },
      ],
    },
    [
      { id: 'burpee', sets: 4, reps: 10, rest: 40 },
      { id: 'jacks', sets: 4, reps: 40, rest: 30 },
      { id: 'squat', sets: 4, reps: 15, rest: 40 },
      { id: 'lunge', sets: 3, reps: 12, rest: 40 },
      { id: 'climber', sets: 3, reps: 30, rest: 30 },
      { id: 'crunch', sets: 3, reps: 20, rest: 30 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-elham-starter',
      ownerId: 'elham',
      title: 'شروع سبک',
      description: 'برای اولین قدم؛ سه جلسه‌ی کوتاه در هفته با حرکات پایه.',
      goals: ['fitness'],
      level: 'beginner',
      durationWeeks: 4,
      daysPerWeek: 3,
      price: 99000,
      notes: '',
      safety: '',
      sessions: [{ name: 'شروع', items: ['squat', 'pushup', 'plank'] }],
    },
    [
      { id: 'squat', sets: 2, reps: 12, rest: 45 },
      { id: 'pushup', sets: 2, reps: 6, rest: 45 },
      { id: 'plank', sets: 2, reps: 20, rest: 30 },
    ],
  ),
];

// [programId, reviewer, rating, comment (may be empty), days ago]
const REVIEWS = [
  ['gp-beginner-full-body', 'niloofar', 5, 'برای شروع عالی بود. حرکات ساده و توضیحاتش واضح؛ بعد از دو هفته واقعاً انرژی‌ام بیشتر شده.', 12],
  ['gp-beginner-full-body', 'pouria', 4, 'رایگان بودنش عالیه. فقط ای کاش ویدیوی بیشتری داشت.', 20],
  ['gp-beginner-full-body', 'mahsa', 5, '', 33],
  ['gp-beginner-full-body', 'kamran', 3, 'برنامه خوبیه ولی برای من که قبلاً تمرین می‌کردم زیادی سبک بود.', 41],
  ['gp-kian-push-pull', 'ali', 5, 'بعد از ۸ هفته هم قدرتم رفته بالا هم حجم. تقسیم‌بندی روزها خیلی منطقی بود.', 6],
  ['gp-kian-push-pull', 'babak', 4, 'ارزش پولش رو داره. استراحت بین ست‌ها رو یکم زیاد گذاشته، خودم کمترش کردم.', 15],
  ['gp-kian-push-pull', 'mahan', 5, 'بهترین برنامه‌ای که تا حالا خریدم.', 27],
  ['gp-kian-push-pull', 'shima', 2, 'انتظار بیشتری داشتم؛ توضیح حرکت بارفیکس برای مبتدی کافی نبود.', 35],
  ['gp-thighs', 'taraneh', 5, 'ران‌هام بعد از ۶ هفته کاملاً فرق کرد. حرکات رو دقیق توضیح داده.', 9],
  ['gp-thighs', 'zohreh', 4, 'خوبه ولی سطح متوسط واقعاً سخته! با وزنه‌ی کم شروع کنید.', 18],
  ['gp-thighs', 'niloofar', 5, '', 30],
  ['gp-reza-powerbuilding', 'kamran', 5, 'برنامه حرفه‌ای و سنگینیه. اگر دو سال تمرین منظم ندارید سراغش نروید، ولی برای من که به سقف رسیده بودم جواب داد؛ ددلیفتم ۲۰ کیلو رفت بالا.', 4],
  ['gp-reza-powerbuilding', 'ali', 5, 'ارزش هر تومانش رو داره.', 11],
  ['gp-reza-powerbuilding', 'babak', 3, 'قیمتش بالاست و راهنمای تغذیه ندارد. خود برنامه‌ی تمرینی عالیه.', 23],
  ['gp-reza-powerbuilding', 'pouria', 4, '', 50],
  ['gp-sara-mobility', 'mahsa', 5, 'کمردردم خیلی کمتر شد. بعد از ۲۱ روز حس می‌کنم بدنم باز شده.', 7],
  ['gp-sara-mobility', 'shima', 5, 'ملایم و کاربردی.', 16],
  ['gp-sara-mobility', 'zohreh', 4, '', 25],
  ['gp-sara-morning', 'taraneh', 4, 'برای صبح‌ها عالیه، فقط ۱۰ دقیقه وقت می‌گیره.', 3],
  ['gp-sara-morning', 'niloofar', 5, '', 14],
  ['gp-hamed-home-cardio', 'mahan', 3, 'ساده و رایگانه، ولی بعد از دو هفته تکراری می‌شه.', 10],
  ['gp-elham-fatburn', 'shima', 4, 'سخت ولی جواب می‌ده؛ سه کیلو کم کردم.', 8],
  ['gp-elham-fatburn', 'zohreh', 2, 'برای من که زانو درد دارم مناسب نبود، حرکات پرشی زیاده.', 19],
  ['gp-elham-fatburn', 'mahsa', 3, 'برنامه خوبیه ولی هفته‌ی چهارم خیلی فشرده می‌شه.', 28],
  ['gp-elham-starter', 'taraneh', 5, 'ارزان و کاربردی.', 5],
  ['gp-elham-starter', 'pouria', 4, '', 12],
];

const programOwner = (programId) => {
  const original = { 'gp-beginner-full-body': 'kian', 'gp-thighs': 'maryam' }[programId];
  return original ?? communityPrograms.find((p) => p.id === programId).ownerId;
};

export const communityReviews = REVIEWS.map(([programId, who, rating, text, days], i) => ({
  id: `seed-review-${i + 1}`,
  athleteId: `demo-${who}`,
  trainerId: programOwner(programId),
  targetKind: 'program',
  targetId: programId,
  rating,
  text,
  createdAt: daysAgo(days),
  updatedAt: daysAgo(days),
}));

// [programId, who liked it]
const LIKES = {
  'gp-beginner-full-body': ['niloofar', 'pouria', 'mahsa', 'taraneh', 'ali', 'shima'],
  'gp-kian-push-pull': ['ali', 'babak', 'mahan', 'kamran', 'pouria'],
  'gp-thighs': ['taraneh', 'zohreh', 'niloofar', 'mahsa'],
  'gp-reza-powerbuilding': ['kamran', 'ali', 'babak'],
  'gp-sara-mobility': ['mahsa', 'shima', 'zohreh', 'taraneh', 'niloofar'],
  'gp-sara-morning': ['taraneh', 'niloofar', 'mahsa', 'shima', 'zohreh', 'pouria', 'mahan'],
  'gp-hamed-home-cardio': ['mahan'],
  'gp-elham-fatburn': ['shima', 'mahsa'],
  'gp-elham-starter': ['taraneh', 'pouria', 'niloofar'],
};

export const communityLikes = Object.entries(LIKES).flatMap(([programId, people]) =>
  people.map((who, i) => ({
    id: `seed-like-${programId}-${who}`,
    athleteId: `demo-${who}`,
    programId,
    trainerId: programOwner(programId),
    at: daysAgo(3 + i * 4),
  })),
);
