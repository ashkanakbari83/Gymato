// Initial app state: the coach, three athletes and one program.
import { decks } from './decks';
import { exercises } from './exercises';
import { users } from './users';
import { isoDate } from '../lib/format';

/** "Six-pack in 30 days": two alternating sessions, five days a week for four weeks. */
const sixPack = {
  id: 'six-pack-30',
  name: 'سیکس پک در ۳۰ روز',
  goal: 'عضله‌سازی',
  level: 'متوسط',
  days: 5,
  weeks: 4,
  exercises: ['crunch', 'legraise', 'plank', 'twist', 'jacks', 'climber', 'burpee'],
  targets: {
    crunch: { sets: 3, reps: 20, rest: 30 },
    legraise: { sets: 3, reps: 15, rest: 30 },
    plank: { sets: 3, reps: 45, rest: 30 },
    twist: { sets: 3, reps: 24, rest: 30 },
    jacks: { sets: 3, reps: 40, rest: 30 },
    climber: { sets: 3, reps: 30, rest: 30 },
    burpee: { sets: 3, reps: 10, rest: 45 },
  },
  status: 'قالب',
  owner: 'adel',
  sessions: [
    { name: 'روز A · شکم و میان‌تنه', items: ['crunch', 'legraise', 'plank', 'twist'] },
    { name: 'روز B · قلبی و شکم', items: ['jacks', 'climber', 'burpee', 'plank'] },
  ],
};

/** Athletes receive their own copy of a template (see assignProgram). */
const ashkanCopy = {
  ...sixPack,
  id: 'six-pack-30-ashkan',
  status: 'فعال',
  assignedTo: 'ashkan',
  templateId: sixPack.id,
};

export const createSeedState = () => ({
  version: 4,
  users,
  decks,
  exercises,
  programs: [sixPack, ashkanCopy],
  assignments: [
    { id: 'as1', userId: 'ashkan', programId: ashkanCopy.id, programName: ashkanCopy.name, startDate: isoDate(), status: 'فعال' },
  ],
  sessions: [],
  notifications: [],
  favorites: [],
  activeUser: 'ashkan',
  activeWorkout: null,
  theme: 'light',
  language: 'fa',
});
