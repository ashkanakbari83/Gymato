// Common foods with an approximate amount of energy per serving, for the food log. Numbers are rounded
// averages for a typical home portion — estimates to give a rough picture, not nutrition-label values.
// [id, Persian name, English name, serving (fa), serving (en), kcal, protein g, carbs g, fat g, group]
const ROWS = [
  // bread and grains
  ['sangak', 'نان سنگک', 'Sangak bread', 'یک تکه (۵۰ گرم)', '1 piece (50 g)', 130, 4, 27, 1, 'grain'],
  ['lavash', 'نان لواش', 'Lavash bread', 'یک برگ', '1 sheet', 110, 4, 22, 1, 'grain'],
  ['barbari', 'نان بربری', 'Barbari bread', 'یک تکه (۷۰ گرم)', '1 piece (70 g)', 190, 6, 37, 2, 'grain'],
  ['rice', 'برنج (چلو)', 'Rice (chelo)', 'یک بشقاب (۲۰۰ گرم)', '1 plate (200 g)', 340, 6, 66, 6, 'grain'],
  ['oats', 'جو دوسر', 'Oats', 'یک کاسه (۴۰ گرم خشک)', '1 bowl (40 g dry)', 150, 5, 27, 3, 'grain'],
  ['pasta', 'ماکارونی', 'Pasta', 'یک بشقاب', '1 plate', 400, 13, 70, 8, 'grain'],
  // protein
  ['egg-boiled', 'تخم‌مرغ آب‌پز', 'Boiled egg', 'یک عدد', '1 egg', 78, 6, 1, 5, 'protein'],
  ['egg-fried', 'نیمرو', 'Fried egg', 'یک عدد', '1 egg', 95, 6, 1, 7, 'protein'],
  ['omelette', 'املت', 'Omelette (Persian)', 'یک پرس (۲ تخم‌مرغ)', '1 serving (2 eggs)', 250, 14, 8, 18, 'protein'],
  ['chicken-breast', 'سینه مرغ گریل', 'Grilled chicken breast', '۱۰۰ گرم', '100 g', 165, 31, 0, 4, 'protein'],
  ['joojeh', 'جوجه‌کباب', 'Joojeh kabab', 'یک سیخ (۱۵۰ گرم)', '1 skewer (150 g)', 250, 30, 2, 13, 'protein'],
  ['kubideh', 'کباب کوبیده', 'Kubideh kabab', 'یک سیخ (۸۰ گرم)', '1 skewer (80 g)', 200, 14, 2, 15, 'protein'],
  ['fish', 'ماهی گریل', 'Grilled fish', '۱۵۰ گرم', '150 g', 230, 34, 0, 10, 'protein'],
  ['tuna', 'کنسرو ماهی تن', 'Canned tuna', 'یک قوطی (۱۲۰ گرم)', '1 can (120 g)', 130, 28, 0, 2, 'protein'],
  ['whey', 'پودر پروتئین (وی)', 'Whey protein', 'یک اسکوپ', '1 scoop', 120, 24, 3, 2, 'protein'],
  // Iranian dishes
  ['ghorme', 'قورمه‌سبزی', 'Ghormeh sabzi', 'یک ملاقه (۱۵۰ گرم)', '1 ladle (150 g)', 220, 12, 9, 14, 'dish'],
  ['gheimeh', 'خورشت قیمه', 'Gheimeh', 'یک ملاقه (۱۵۰ گرم)', '1 ladle (150 g)', 230, 11, 14, 14, 'dish'],
  ['abgoosht', 'آبگوشت', 'Abgoosht', 'یک پرس', '1 serving', 450, 28, 40, 18, 'dish'],
  ['dizi', 'دیزی', 'Dizi', 'یک پرس', '1 serving', 600, 35, 50, 28, 'dish'],
  ['kuku', 'کوکو سبزی', 'Kuku sabzi', 'یک برش', '1 slice', 150, 8, 6, 10, 'dish'],
  ['ash', 'آش رشته', 'Ash reshteh', 'یک کاسه', '1 bowl', 250, 12, 38, 6, 'dish'],
  ['lentil-soup', 'سوپ عدس', 'Lentil soup', 'یک کاسه', '1 bowl', 230, 14, 36, 4, 'dish'],
  ['barley-soup', 'سوپ جو', 'Barley soup', 'یک کاسه', '1 bowl', 150, 7, 24, 3, 'dish'],
  ['salad', 'سالاد شیرازی', 'Shirazi salad', 'یک کاسه', '1 bowl', 60, 2, 10, 2, 'dish'],
  ['falafel-sandwich', 'ساندویچ فلافل', 'Falafel sandwich', 'یک عدد', '1 sandwich', 520, 15, 62, 24, 'dish'],
  // dairy
  ['yogurt', 'ماست', 'Yogurt', 'یک کاسه (۱۵۰ گرم)', '1 bowl (150 g)', 100, 6, 8, 5, 'dairy'],
  ['milk', 'شیر', 'Milk', 'یک لیوان (۲۴۰ میلی‌لیتر)', '1 glass (240 ml)', 120, 8, 12, 5, 'dairy'],
  ['cheese', 'پنیر', 'Cheese', 'یک قوطی کبریت (۳۰ گرم)', '1 matchbox (30 g)', 80, 5, 1, 6, 'dairy'],
  ['doogh', 'دوغ', 'Doogh', 'یک لیوان', '1 glass', 50, 3, 4, 2, 'dairy'],
  // fruit and nuts
  ['banana', 'موز', 'Banana', 'یک عدد', '1 medium', 105, 1, 27, 0, 'fruit'],
  ['apple', 'سیب', 'Apple', 'یک عدد', '1 medium', 95, 0, 25, 0, 'fruit'],
  ['orange', 'پرتقال', 'Orange', 'یک عدد', '1 medium', 62, 1, 15, 0, 'fruit'],
  ['watermelon', 'هندوانه', 'Watermelon', 'یک برش بزرگ', '1 large slice', 85, 2, 21, 0, 'fruit'],
  ['dates', 'خرما', 'Dates', 'یک عدد', '1 date', 25, 0, 7, 0, 'fruit'],
  ['almond', 'بادام', 'Almonds', 'یک مشت (۳۰ گرم)', '1 handful (30 g)', 170, 6, 6, 15, 'fruit'],
  ['walnut', 'گردو', 'Walnuts', 'سه عدد (۲۰ گرم)', '3 pieces (20 g)', 130, 3, 3, 13, 'fruit'],
  ['peanut-butter', 'کره بادام‌زمینی', 'Peanut butter', 'یک قاشق غذاخوری', '1 tbsp', 95, 4, 3, 8, 'fruit'],
  // fast food, sweets, drinks
  ['pizza', 'پیتزا', 'Pizza', 'یک برش', '1 slice', 270, 11, 33, 10, 'treat'],
  ['burger', 'همبرگر', 'Burger', 'یک عدد', '1 burger', 450, 22, 38, 23, 'treat'],
  ['fries', 'سیب‌زمینی سرخ‌کرده', 'French fries', 'یک پرس متوسط', '1 medium serving', 320, 4, 41, 15, 'treat'],
  ['cake', 'کیک', 'Cake', 'یک برش', '1 slice', 280, 4, 40, 12, 'treat'],
  ['ice-cream', 'بستنی', 'Ice cream', 'یک اسکوپ', '1 scoop', 140, 2, 17, 7, 'treat'],
  ['soda', 'نوشابه', 'Soft drink', 'یک قوطی (۳۳۰ میلی‌لیتر)', '1 can (330 ml)', 140, 0, 35, 0, 'drink'],
  ['juice', 'آب‌میوه', 'Fruit juice', 'یک لیوان', '1 glass', 110, 1, 26, 0, 'drink'],
  ['tea-sugar', 'چای شیرین', 'Sweet tea', 'یک استکان با دو حبه قند', '1 glass with 2 sugar cubes', 25, 0, 6, 0, 'drink'],
];

export const FOOD_GROUPS = ['grain', 'protein', 'dish', 'dairy', 'fruit', 'treat', 'drink'];

export const foods = ROWS.map(([id, fa, en, servingFa, servingEn, kcal, protein, carbs, fat, group]) => ({
  id,
  name: { fa, en },
  serving: { fa: servingFa, en: servingEn },
  kcal,
  protein,
  carbs,
  fat,
  group,
}));

export const getFood = (id) => foods.find((f) => f.id === id) ?? null;
