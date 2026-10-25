// Body-mass index helpers shown to coaches.

/** BMI from height (cm) and weight (kg); null when either is missing. */
export function calcBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

/** WHO adult categories. `labelKey` is an i18n key; `tone` maps to a colour class in the UI. */
export function bmiCategory(bmi) {
  if (bmi < 18.5) return { labelKey: 'bmi.low', tone: 'low' };
  if (bmi < 25) return { labelKey: 'bmi.normal', tone: 'ok' };
  if (bmi < 30) return { labelKey: 'bmi.over', tone: 'warn' };
  return { labelKey: 'bmi.obese', tone: 'warn' };
}
