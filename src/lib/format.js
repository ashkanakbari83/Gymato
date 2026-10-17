// Formatting helpers: Persian digits, dates, clock, ids.
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export const faNum = (value) => String(value ?? 0).replace(/\d/g, (d) => PERSIAN_DIGITS[d]);

/** Decimal with Persian digits and separator, trailing zeros dropped: 24.30 -> ۲۴٫۳ */
export const faDecimal = (value, digits = 1) => faNum(Number(value.toFixed(digits)).toString().replace('.', '٫'));

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/** Public, shareable account ID such as JM-4F2A91. */
export function makePublicId(users) {
  let id;
  do {
    id = `JM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  } while (users.some((u) => u.publicId === id));
  return id;
}

export const formatClock = (totalSeconds) =>
  `${faNum(Math.floor(totalSeconds / 60)).padStart(2, '۰')}:${faNum(totalSeconds % 60).padStart(2, '۰')}`;

export const formatDate = (iso, options) => new Date(iso).toLocaleDateString('fa-IR', options);

export const isoDate = (date = new Date()) => date.toISOString().slice(0, 10);

/** Today's date in the Persian calendar, e.g. «یکشنبه ۲۶ مهر ۱۴۰۵». */
export const formatToday = () =>
  new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
