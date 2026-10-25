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

const TRAINER_TABS = ['home', 'clients', 'programs', 'insights', 'exercises'];
const ATHLETE_TABS = ['home', 'exercises', 'trainers', 'programs', 'progress'];

export const getNavItems = (isTrainer) => (isTrainer ? TRAINER_TABS : ATHLETE_TABS).map((id) => ({ id, icon: ITEMS[id] }));

/** The tab to highlight for a page (a trainer's profile belongs to "trainers"). */
export const navTabFor = (page) => (page === 'trainer' ? 'trainers' : page);

export function getPageTitle(page, user, isTrainer, t) {
  if (page === 'home') return t(isTrainer ? 'nav.home' : 'home.greeting', { name: user.name });
  if (page === 'programs') return t(isTrainer ? 'programs.manageTitle' : 'programs.myTitle');
  return t(`nav.${page}`);
}
