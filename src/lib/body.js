// Body-mass index helpers shown to coaches.

/** BMI from height (cm) and weight (kg); null when either is missing. */
export function calcBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

/** WHO adult categories. `tone` maps to a colour class in the UI. */
export function bmiCategory(bmi) {
  if (bmi < 18.5) return { label: 'کم‌وزن', tone: 'low' };
  if (bmi < 25) return { label: 'نرمال', tone: 'ok' };
  if (bmi < 30) return { label: 'اضافه‌وزن', tone: 'warn' };
  return { label: 'چاقی', tone: 'warn' };
}
