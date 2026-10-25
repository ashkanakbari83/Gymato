// Provinces and a few major cities, with both display languages.
const city = (id, fa, en) => ({ id, fa, en });

export const PROVINCES = [
  { id: 'tehran', fa: 'تهران', en: 'Tehran', cities: [city('tehran-c', 'تهران', 'Tehran'), city('shahriar', 'شهریار', 'Shahriar')] },
  { id: 'alborz', fa: 'البرز', en: 'Alborz', cities: [city('karaj-c', 'کرج', 'Karaj'), city('fardis', 'فردیس', 'Fardis')] },
  { id: 'isfahan', fa: 'اصفهان', en: 'Isfahan', cities: [city('isfahan-c', 'اصفهان', 'Isfahan'), city('kashan', 'کاشان', 'Kashan'), city('najafabad', 'نجف‌آباد', 'Najafabad')] },
  { id: 'razavi', fa: 'خراسان رضوی', en: 'Razavi Khorasan', cities: [city('mashhad-c', 'مشهد', 'Mashhad'), city('neyshabur', 'نیشابور', 'Neyshabur')] },
  { id: 'fars', fa: 'فارس', en: 'Fars', cities: [city('shiraz-c', 'شیراز', 'Shiraz'), city('marvdasht', 'مرودشت', 'Marvdasht')] },
  { id: 'east-azerbaijan', fa: 'آذربایجان شرقی', en: 'East Azerbaijan', cities: [city('tabriz-c', 'تبریز', 'Tabriz')] },
  { id: 'gilan', fa: 'گیلان', en: 'Gilan', cities: [city('rasht-c', 'رشت', 'Rasht'), city('anzali', 'بندر انزلی', 'Bandar Anzali')] },
  { id: 'khuzestan', fa: 'خوزستان', en: 'Khuzestan', cities: [city('ahvaz-c', 'اهواز', 'Ahvaz'), city('abadan', 'آبادان', 'Abadan')] },
  { id: 'mazandaran', fa: 'مازندران', en: 'Mazandaran', cities: [city('sari-c', 'ساری', 'Sari'), city('babol', 'بابل', 'Babol')] },
  { id: 'kerman', fa: 'کرمان', en: 'Kerman', cities: [city('kerman-c', 'کرمان', 'Kerman')] },
];

export const getProvince = (id) => PROVINCES.find((p) => p.id === id) ?? null;
export const getCity = (provinceId, cityId) => getProvince(provinceId)?.cities.find((c) => c.id === cityId) ?? null;

/** "City, Province" in the given language; empty string when unknown. */
export function locationLabel(provinceId, cityId, lang = 'fa') {
  const province = getProvince(provinceId);
  const cityItem = getCity(provinceId, cityId);
  return [cityItem?.[lang], province?.[lang]].filter(Boolean).join(lang === 'fa' ? '، ' : ', ');
}
