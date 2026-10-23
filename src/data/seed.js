// Initial app state: three trainers, three athletes and three published general programs.
// Coaching requests, payments, subscriptions and chats all start empty.
import { decks } from './decks.js';
import { exercises } from './exercises.js';
import { users } from './users.js';
import { PROGRAM_KIND, PROGRAM_STATUS, STATE_VERSION } from '../lib/constants.js';
import { buildSessions } from '../lib/programs.js';

const createdAt = () => new Date().toISOString();

/** Builds a published general program; `plan` is [{ id, sets, reps, rest }]. */
const generalProgram = (fields, plan) => {
  const exerciseIds = plan.map((item) => item.id);
  return {
    kind: PROGRAM_KIND.GENERAL,
    status: PROGRAM_STATUS.PUBLISHED,
    exercises: exerciseIds,
    targets: Object.fromEntries(plan.map(({ id, sets, reps, rest }) => [id, { sets, reps, rest }])),
    sessions: buildSessions(fields.sessions, exerciseIds),
    createdAt: createdAt(),
    updatedAt: createdAt(),
    ...fields,
  };
};

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
];

export const createSeedState = () => ({
  version: STATE_VERSION,
  users,
  exercises,
  decks,
  programs, // general programs published by trainers
  freeLibrary: [], // free programs an athlete added: { athleteId, programId }
  customPrograms: [], // private, athlete-specific programs
  requests: [], // custom coaching requests
  conversations: [],
  messages: [],
  payments: [], // simulated payments (demo: true)
  subscriptions: [], // coaching subscriptions
  sessions: [], // finished workouts
  notifications: [],
  favorites: [],
  activeUser: 'ashkan',
  activeWorkout: null,
  theme: 'light',
  language: 'fa',
});
