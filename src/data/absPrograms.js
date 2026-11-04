// Six-pack programs, built from the abs research (EMG exercise rankings and the programming advice of
// evidence-minded coaches: abs respond like any muscle, so 2–4 sessions a week, 10–30 reps close to failure,
// and a bit more load or reps over time). Two things every program says plainly: abs only show once body fat
// is low enough, and training abs does not burn fat from the belly ("spot reduction" does not work).
import { generalProgram } from './community.js';

const VISIBILITY_NOTE =
  'دیده شدن عضلات شکم بیشتر به درصد چربی بدن بستگی دارد و تمرین شکم چربی همان ناحیه را نمی‌سوزاند؛ کنار تمرین، تغذیه و خواب و فعالیت روزانه را هم جدی بگیر.';
const PROGRESS_NOTE = 'هر هفته یا یکی دو تکرار (یا چند ثانیه) اضافه کن، یا در حرکات وزنه‌دار کمی بار را بیشتر کن. به محض اینکه فرمت خراب شد، همان‌جا ست را تمام کن.';
const BACK_SAFETY = 'اگر کمر یا گردنت درد گرفت حرکت را متوقف کن. این برنامه جایگزین نظر پزشک یا فیزیوتراپ نیست.';

export const absPrograms = [
  generalProgram(
    {
      id: 'gp-abs-bodyweight-start',
      ownerId: 'elham',
      title: 'سیکس پک بدون وزنه · شروع',
      description: 'برای کسی که تازه شروع کرده است: شش حرکت ساده با وزن بدن در دو جلسه‌ی متناوب؛ تمرکز روی کنترل کمر و تکنیک درست.',
      goals: ['abs', 'fitness'],
      level: 'beginner',
      durationWeeks: 4,
      daysPerWeek: 3,
      price: 0,
      notes: `روزهای تمرین را یک روز در میان بگذار و بین ست‌ها ۳۰ تا ۴۵ ثانیه استراحت کن. ${PROGRESS_NOTE} ${VISIBILITY_NOTE}`,
      safety: BACK_SAFETY,
      sessions: [
        { name: 'روز A · کنترل و شکم پایین', items: ['reversecrunch', 'deadbug', 'plank'] },
        { name: 'روز B · شکم و پهلو', items: ['crunch', 'sideplank', 'bicycle'] },
      ],
    },
    [
      { id: 'reversecrunch', sets: 3, reps: 10, rest: 45 },
      { id: 'deadbug', sets: 3, reps: 10, rest: 45 },
      { id: 'plank', sets: 3, reps: 20, rest: 45 },
      { id: 'crunch', sets: 3, reps: 12, rest: 45 },
      { id: 'sideplank', sets: 2, reps: 20, rest: 30 },
      { id: 'bicycle', sets: 3, reps: 16, rest: 45 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-abs-bodyweight-progressive',
      ownerId: 'adel',
      title: 'سیکس پک بدون وزنه · پیشرفته‌تر',
      description: 'برنامه‌ی ۶ هفته‌ای فقط با وزن بدن، با حرکات سخت‌تر مثل وی‌آپ و هالو هولد، برای کسی که پایه دارد و باشگاه ندارد.',
      goals: ['abs', 'fatloss'],
      level: 'intermediate',
      durationWeeks: 6,
      daysPerWeek: 3,
      price: 190000,
      notes: `بین ست‌ها ۴۵ تا ۶۰ ثانیه استراحت کن. ${PROGRESS_NOTE} ${VISIBILITY_NOTE}`,
      safety: BACK_SAFETY,
      sessions: [
        { name: 'روز A · شکم کامل', items: ['reversecrunch', 'vup', 'hollow', 'sideplank'] },
        { name: 'روز B · حجم و کنترل', items: ['situp', 'legraise', 'bicycle', 'climber'] },
      ],
    },
    [
      { id: 'reversecrunch', sets: 4, reps: 12, rest: 45 },
      { id: 'vup', sets: 3, reps: 10, rest: 60 },
      { id: 'hollow', sets: 3, reps: 25, rest: 45 },
      { id: 'sideplank', sets: 3, reps: 30, rest: 30 },
      { id: 'situp', sets: 3, reps: 15, rest: 45 },
      { id: 'legraise', sets: 3, reps: 12, rest: 45 },
      { id: 'bicycle', sets: 3, reps: 20, rest: 45 },
      { id: 'climber', sets: 3, reps: 30, rest: 30 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-abs-gym-weighted',
      ownerId: 'reza',
      title: 'سیکس پک با وزنه · باشگاه',
      description: 'هشت هفته تمرین شکم مثل عضلات دیگر: کرانچ کابل و دراز و نشست با وزنه با بار قابل افزایش، به‌علاوه‌ی ثبات میان‌تنه.',
      goals: ['abs', 'muscle'],
      level: 'intermediate',
      durationWeeks: 8,
      daysPerWeek: 3,
      price: 350000,
      notes: `بین ست‌ها ۶۰ تا ۹۰ ثانیه استراحت کن؛ در کرانچ کابل و دراز و نشست وزنه را وقتی بالا ببر که همه‌ی تکرارها را تمیز بزنی. ${VISIBILITY_NOTE}`,
      safety: BACK_SAFETY,
      sessions: [
        { name: 'روز A · کابل و میله', items: ['cablecrunch', 'hangraise', 'pallof'] },
        { name: 'روز B · وزنه و میان‌تنه', items: ['situp', 'woodchop', 'carry'] },
      ],
    },
    [
      { id: 'cablecrunch', sets: 4, reps: 12, rest: 75 },
      { id: 'hangraise', sets: 3, reps: 12, rest: 60 },
      { id: 'pallof', sets: 3, reps: 10, rest: 45 },
      { id: 'situp', sets: 3, reps: 12, rest: 60 },
      { id: 'woodchop', sets: 3, reps: 12, rest: 60 },
      { id: 'carry', sets: 3, reps: 45, rest: 45 },
    ],
  ),
  generalProgram(
    {
      id: 'gp-abs-advanced',
      ownerId: 'reza',
      title: 'سیکس پک پیشرفته · وزنه و میله',
      description: 'برای ورزشکار باتجربه: چرخ شکم، بالا آوردن پا از میله، کرانچ کابل و وی‌آپ در سه جلسه‌ی هفتگی؛ حجم بالاتر و فشار بیشتر.',
      goals: ['abs', 'strength'],
      level: 'advanced',
      durationWeeks: 8,
      daysPerWeek: 3,
      price: 450000,
      notes: `بین ست‌ها ۶۰ تا ۹۰ ثانیه استراحت کن. اگر ریکاوری‌ات خوب نبود، حجم را کم کن؛ بیشتر همیشه بهتر نیست. ${VISIBILITY_NOTE}`,
      safety: `چرخ شکم و بالا آوردن پا فشار زیادی دارند؛ فقط تا جایی برو که کمر گود نمی‌شود. ${BACK_SAFETY}`,
      sessions: [
        { name: 'روز A · چرخ و کابل', items: ['abwheel', 'hangraise', 'cablecrunch'] },
        { name: 'روز B · وزنه و وی‌آپ', items: ['vup', 'situp', 'hollow'] },
        { name: 'روز C · پهلو و حمل', items: ['woodchop', 'sideplank', 'carry'] },
      ],
    },
    [
      { id: 'abwheel', sets: 4, reps: 8, rest: 75 },
      { id: 'hangraise', sets: 4, reps: 15, rest: 60 },
      { id: 'cablecrunch', sets: 4, reps: 12, rest: 75 },
      { id: 'vup', sets: 4, reps: 12, rest: 60 },
      { id: 'situp', sets: 4, reps: 12, rest: 60 },
      { id: 'hollow', sets: 3, reps: 40, rest: 45 },
      { id: 'woodchop', sets: 3, reps: 12, rest: 60 },
      { id: 'sideplank', sets: 3, reps: 45, rest: 30 },
      { id: 'carry', sets: 3, reps: 45, rest: 45 },
    ],
  ),
];
