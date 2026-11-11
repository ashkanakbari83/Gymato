// Navigation: the trainer and the athlete see different tabs. Labels come from `nav.<id>` in the dictionaries.
import { CalendarDays, ChartNoAxesCombined, Dumbbell, LayoutDashboard, Search, TrendingUp, Users } from 'lucide-react';

const ITEMS = {
  home: LayoutDashboard,
  clients: Users,
  trainers: Search,
  programs: CalendarDays,
  exercises: Dumbbell,
  progress: ChartNoAxesCombined,
  insights: TrendingUp,
};

const TRAINER_TABS = ['home', 'clients', 'programs', 'trainers', 'insights'];
const ATHLETE_TABS = ['home', 'exercises', 'trainers', 'programs', 'progress'];

// The phone dock stays short: the home launcher already reaches everything else (trainers, moves, stats), and the full set remains in the desktop top bar.
const DOCK_TABS_TRAINER = ['home', 'clients', 'programs'];
const DOCK_TABS_ATHLETE = ['home', 'programs', 'progress'];

export const getDockItems = (isTrainer) => (isTrainer ? DOCK_TABS_TRAINER : DOCK_TABS_ATHLETE).map((id) => ({ id, icon: ITEMS[id] }));

export const getNavItems = (isTrainer) => (isTrainer ? TRAINER_TABS : ATHLETE_TABS).map((id) => ({ id, icon: ITEMS[id] }));

/** The tab to highlight for a page (a trainer's profile belongs to "trainers", the food log to "home"). */
export const navTabFor = (page) => (page === 'trainer' ? 'trainers' : page === 'nutrition' || page === 'premium' || page === 'admin' ? 'home' : page);

export function getPageTitle(page, user, isTrainer, t) {
  if (page === 'home') return t(isTrainer ? 'nav.home' : 'home.greeting', { name: user.name });
  if (page === 'programs') return t(isTrainer ? 'programs.manageTitle' : 'programs.myTitle');
  return t(`nav.${page}`);
}
