// Starter accounts. Only these four exist by default, and all of them are admins with the username
// "admin" and the password "admin" (the sign-in screen lets the person pick which of the four to open).
// publicId is a short shareable ID. Trainers carry a public profile; athletes carry body info.
import { createCredentials } from '../lib/auth.js';

const admin = (id) => ({ username: 'admin', isAdmin: true, ...createCredentials('admin', `jimato-seed-${id}`) });

export const users = [
  {
    id: 'ashkan',
    name: 'اشکان',
    role: 'athlete',
    roles: ['athlete'],
    ...admin('ashkan'),
    publicId: 'JM-AS4K71',
    age: 27,
    height: 182,
    weight: 84,
    goal: 'muscle',
    level: 'intermediate',
    province: 'tehran',
    city: 'tehran-c',
  },
  {
    id: 'adel',
    name: 'عادل',
    role: 'coach',
    roles: ['coach'],
    ...admin('adel'),
    publicId: 'JM-A1D3L0',
    province: 'tehran',
    city: 'tehran-c',
    specialties: ['abs', 'fatloss', 'strength'],
    bio: 'مربی قدرتی با ۱۲ سال سابقه؛ تمرکز روی تقویت شکم و چربی‌سوزی.',
    experienceYears: 12,
    offersCoaching: true,
  },
  {
    id: 'bardia',
    name: 'بردیا',
    role: 'athlete',
    roles: ['athlete'],
    ...admin('bardia'),
    publicId: 'JM-BR7D29',
    age: 24,
    height: 175,
    weight: 78,
    goal: 'fatloss',
    level: 'beginner',
    province: 'alborz',
    city: 'karaj-c',
  },
  {
    id: 'mohammad',
    name: 'محمد',
    role: 'athlete',
    roles: ['athlete'],
    ...admin('mohammad'),
    publicId: 'JM-MH2M85',
    age: 31,
    height: 170,
    weight: 66,
    goal: 'endurance',
    level: 'intermediate',
    province: 'razavi',
    city: 'mashhad-c',
  },
];
