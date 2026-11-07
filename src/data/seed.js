// Initial app state: four starter accounts (all admins), a sample community of trainers with programs,
// reviews and likes so the marketplace looks lived-in, and three programs from the original demo.
// Plus one busy professional trainer (kamran) with clients, income, reviews and views, so the trainer screens and the
// admin panel have volume to show. Everything else (requests, payments, subscriptions, chats) starts empty.
import { gilanAthletes, gilanLikes, gilanPrograms, gilanReviews, gilanTrainers } from './gilan.js';
import { premiumPaymentsFor, regionAthletes, regionLikes, regionPrograms, regionReviews, regionTrainers } from './regions.js';
import {
  proAthletes, proConversations, proCustomPrograms, proEvents, proLikes, proMessages, proNotifications, proPayments, proPrograms, proRequests, proReviews, proSubscriptions, proTrainer,
} from './proTrainer.js';
import { communityAthletes, communityLikes, communityPrograms, communityReviews, communityTrainers, generalProgram } from './community.js';
import { absPrograms } from './absPrograms.js';
import { decks } from './decks.js';
import { exercises } from './exercises.js';
import { users as accounts } from './users.js';
import { DEFAULT_SETTINGS, SEED_RELEASE, STATE_VERSION } from '../lib/constants.js';
import { DEFAULT_FEEDBACK } from '../lib/feedback.js';

const programs = [
  generalProgram(
    {
      id: 'gp-six-pack',
      ownerId: 'adel',
      title: 'سیکس پک در ۳۰ روز',
      description: 'برنامه‌ای ۳۰ روزه برای تقویت عضلات شکم و میان‌تنه، با دو جلسه متناوب در هفته‌های چهارگانه.',
      goals: ['abs', 'fatloss'],
      level: 'intermediate',
      durationWeeks: 4,
      daysPerWeek: 5,
      price: 490000,
      notes: 'بین ست‌ها آب بنوش و هر هفته یک روز کامل استراحت کن.',
      safety: 'اگر کمرت درد گرفت حرکت را متوقف کن. این برنامه جایگزین نظر پزشک نیست.',
      mealPlan: {
        meals: [
          { id: 'six-b', slot: 'breakfast', title: '', text: 'دو تخم‌مرغ آب‌پز یا نیمرو، یک تکه نان سنگک، خیار و گوجه، یک لیوان چای بدون شکر.', kcal: 380 },
          { id: 'six-l', slot: 'lunch', title: '', text: 'یک کف دست مرغ یا ماهی گریل، یک بشقاب کوچک برنج، سالاد شیرازی و ماست.', kcal: 650 },
          { id: 'six-p', slot: 'post', title: '', text: 'یک موز و یک لیوان شیر یا ماست، بعد از تمرین.', kcal: 230 },
          { id: 'six-d', slot: 'dinner', title: '', text: 'املت یا کوکو سبزی با سالاد و نان کم.', kcal: 450 },
        ],
        note: 'بین وعده‌ها آب بنوش و از نوشابه و شیرینی پرهیز کن؛ مقدار غذا را با گرسنگی خودت تنظیم کن.',
      },
      sessions: [
        { name: 'روز A · شکم و میان‌تنه', items: ['crunch', 'legraise', 'plank', 'twist'] },
        { name: 'روز B · قلبی و شکم', items: ['jacks', 'climber', 'burpee', 'plank'] },
      ],
    },
    [
      { id: 'crunch', sets: 3, reps: 20, rest: 30 },
      { id: 'legraise', sets: 3, reps: 15, rest: 30 },
      { id: 'plank', sets: 3, reps: 45, rest: 30 },
      { id: 'twist', sets: 3, reps: 24, rest: 30 },
      { id: 'jacks', sets: 3, reps: 40, rest: 30 },
      { id: 'climber', sets: 3, reps: 30, rest: 30 },
      { id: 'burpee', sets: 3, reps: 10, rest: 45 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-beginner-full-body',
      ownerId: 'kian',
      title: 'تمرین تمام بدن مبتدی',
      description: 'شروع ساده و رایگان برای کسی که تازه تمرین را شروع کرده؛ سه جلسه در هفته با وزن بدن.',
      goals: ['fitness', 'fullbody'],
      level: 'beginner',
      durationWeeks: 4,
      daysPerWeek: 3,
      price: 0,
      notes: 'روزهای تمرین را یک روز در میان بگذار.',
      safety: 'گرم کردن را فراموش نکن و اگر دردی تیز حس کردی متوقف شو.',
      sessions: [{ name: 'تمام بدن', items: ['jacks', 'squat', 'pushup', 'plank', 'hamstring'] }],
    },
    [
      { id: 'jacks', sets: 2, reps: 30, rest: 30 },
      { id: 'squat', sets: 3, reps: 12, rest: 45 },
      { id: 'pushup', sets: 3, reps: 8, rest: 45 },
      { id: 'plank', sets: 2, reps: 30, rest: 30 },
      { id: 'hamstring', sets: 2, reps: 30, rest: 15 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-thighs',
      ownerId: 'maryam',
      title: 'تقویت عضلات ران',
      description: 'تمرکز روی چهارسر و همسترینگ با حرکات پایه‌ای؛ مناسب سطح متوسط.',
      goals: ['thighs', 'glutes'],
      level: 'intermediate',
      durationWeeks: 6,
      daysPerWeek: 3,
      price: 290000,
      notes: 'بین جلسات حداقل ۴۸ ساعت استراحت بده.',
      safety: 'زانوها هم‌جهت پنجه‌ها باشند و کمر صاف بماند.',
      sessions: [{ name: 'پایین‌تنه', items: ['squat', 'lunge', 'deadlift', 'hamstring'] }],
    },
    [
      { id: 'squat', sets: 4, reps: 15, rest: 60 },
      { id: 'lunge', sets: 3, reps: 12, rest: 60 },
      { id: 'deadlift', sets: 3, reps: 8, rest: 90 },
      { id: 'hamstring', sets: 2, reps: 30, rest: 15 },
    ],
  ),
  ...communityPrograms,
  ...absPrograms,
  ...gilanPrograms,
  ...regionPrograms,
  ...proPrograms,
];

/** Accounts first, then the sample trainers and the athletes who reviewed them (neither can sign in). */
const users = [
  ...accounts, proTrainer, ...communityTrainers, ...gilanTrainers, ...regionTrainers,
  ...communityAthletes, ...gilanAthletes, ...regionAthletes, ...proAthletes,
];
/** The payments behind the sample premium subscriptions (the trainer paid the platform), plus the pro trainer's income. */
const payments = [...premiumPaymentsFor([...gilanTrainers, ...regionTrainers]), ...proPayments];

export const createSeedState = () => ({
  version: STATE_VERSION,
  seedRelease: SEED_RELEASE,
  users,
  exercises,
  decks,
  programs, // general programs published by trainers
  freeLibrary: [], // free programs an athlete added: { athleteId, programId }
  customPrograms: proCustomPrograms, // private, athlete-specific programs
  requests: proRequests, // custom coaching requests
  conversations: proConversations,
  messages: proMessages,
  payments, // simulated payments (demo: true)
  subscriptions: proSubscriptions, // coaching subscriptions
  events: proEvents, // views of trainer profiles and programs (one per athlete per day)
  likes: [...communityLikes, ...gilanLikes, ...regionLikes, ...proLikes], // { athleteId, programId, trainerId }
  reviews: [...communityReviews, ...gilanReviews, ...regionReviews, ...proReviews], // ratings + comments on programs and on coaching
  sessions: [], // finished workouts
  notifications: proNotifications,
  settings: { ...DEFAULT_SETTINGS }, // platform settings the admin can change
  favorites: [],
  foodLog: [], // meals an athlete logged: { userId, date, meal, name, servings, kcal, ... }
  waterLog: [], // { userId, date, glasses } (one row per person per day)
  feedback: { ...DEFAULT_FEEDBACK }, // workout sound / vibration / keep-screen-on preferences
  signedIn: false, // the sign-in screen shows until someone signs in
  activeUser: 'ashkan',
  activeWorkout: null,
  theme: 'light',
  language: 'fa',
});
