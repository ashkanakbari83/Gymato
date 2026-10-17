// Navigation items and page titles (the coach and athlete see different last tabs).
import { CalendarDays, ChartNoAxesCombined, Dumbbell, LayoutDashboard, UserRound, Users } from 'lucide-react';

export const getNavItems = (isCoach) => [
  { id: 'home', label: 'خانه', icon: LayoutDashboard },
  { id: 'exercises', label: 'حرکات', icon: Dumbbell },
  { id: 'programs', label: 'برنامه‌ها', icon: CalendarDays },
  { id: 'progress', label: 'پیشرفت', icon: ChartNoAxesCombined },
  isCoach ? { id: 'athletes', label: 'شاگردها', icon: Users } : { id: 'profile', label: 'پروفایل', icon: UserRound },
];

export const getPageTitle = (page, user, isCoach) =>
  ({
    home: isCoach ? 'نمای کلی' : `سلام، ${user.name}`,
    exercises: 'حرکات',
    programs: isCoach ? 'برنامه‌ها' : 'برنامه من',
    progress: 'پیشرفت',
    athletes: 'شاگردها',
    profile: 'پروفایل',
    settings: 'تنظیمات',
  })[page] ?? 'جیماتو';
