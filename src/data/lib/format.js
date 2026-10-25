// Formatting helpers. Digits, dates and currency follow the active UI language
// (set once per render by AppProvider via setFormatLanguage).

let language = 'fa';
export const setFormatLanguage = (next) => {
  language = next;
};
export const locale = () => (language === 'fa' ? 'fa-IR' : 'en-US');

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Number as text with the active language's digits. */
export const num = (value) =>
  language === 'fa' ? String(value ?? 0).replace(/\d/g, (d) => PERSIAN_DIGITS[d]) : String(value ?? 0);

/** Decimal with trailing zeros dropped: 24.30 -> ۲۴٫۳ / 24.3 */
export const decimal = (value, digits = 1) => {
  const text = Number(value.toFixed(digits)).toString();
  return language === 'fa' ? num(text.replace('.', '٫')) : text;
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** "۱٬۲۳۴ تومان" / "1,234" -> "1234". Accepts Persian, Arabic and Latin digits and drops everything else. */
export const parseMoney = (text) =>
  String(text)
    .replace(/[۰-۹]/g, (d) => PERSIAN_DIGITS.indexOf(d))
    .replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d))
    .replace(/\D/g, '');

/** Price in the app currency; 0 is shown as "free". `t` is the translate function. */
export const formatPrice = (amount, t) =>
  amount === 0 ? t('common.free') : `${Number(amount).toLocaleString(locale())} ${t('common.currency')}`;

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
  `${num(Math.floor(totalSeconds / 60)).padStart(2, language === 'fa' ? '۰' : '0')}:${num(totalSeconds % 60).padStart(2, language === 'fa' ? '۰' : '0')}`;

export const formatDate = (iso, options = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  new Date(iso).toLocaleDateString(locale(), options);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(locale(), { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Today's date in the active language's calendar. */
export const formatToday = () =>
  new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
