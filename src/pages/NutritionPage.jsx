// Athlete: food and water log for a day, with a gentle energy estimate and the last seven days.
// Numbers are estimates for orientation. Going over the estimate is never shown as an error.
import { Droplets, Minus, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { ArrowBack, ArrowForward } from '../components/ui/Arrow.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getFood } from '../data/foods.js';
import { GLASS_ML, MEAL_TYPES, dailyTarget, dayKey, entriesFor, recentDays, shiftDay, totalsOf, waterFor, waterGoal } from '../lib/domain/nutrition.js';
import { decimal, formatDate, groupNumber, num } from '../lib/format.js';

/** What a logged item is called: the food list's name in the current language, or what the person typed. */
export const entryName = (entry, lang) => (entry.foodId ? getFood(entry.foodId)?.name[lang] ?? entry.name ?? '' : entry.name);

function DaySwitch({ date, today, onChange }) {
  const { t } = useApp();
  const label = date === today ? t('nutrition.today') : date === shiftDay(today, -1) ? t('nutrition.yesterday') : formatDate(`${date}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="day-switch">
      <button className="icon-btn" onClick={() => onChange(shiftDay(date, -1))} aria-label={t('nutrition.prevDay')}>
        <ArrowBack size={20} />
      </button>
      <b>{label}</b>
      <button className="icon-btn" disabled={date >= today} onClick={() => onChange(shiftDay(date, 1))} aria-label={t('nutrition.nextDay')}>
        <ArrowForward size={20} />
      </button>
    </div>
  );
}

function Summary({ totals, target }) {
  const { t, go } = useApp();
  const pct = target ? Math.min(100, Math.round((totals.kcal / target.kcal) * 100)) : 0;
  return (
    <section className="panel nutri-summary">
      <div className="nutri-kcal">
        <b>{groupNumber(totals.kcal)}</b>
        <span>{target ? t('nutrition.ofTarget', { n: groupNumber(target.kcal) }) : t('nutrition.kcalUnit')}</span>
      </div>
      {target ? (
        <div className="nutri-bar" role="progressbar" aria-valuemin={0} aria-valuemax={target.kcal} aria-valuenow={totals.kcal}>
          <span style={{ width: `${pct}%` }} />
        </div>
      ) : (
        <p className="muted">
          {t('nutrition.needProfile')}{' '}
          <button className="link" onClick={() => go('profile')}>{t('nutrition.openProfile')}</button>
        </p>
      )}
      <div className="nutri-macros">
        {[['protein', totals.protein], ['carbs', totals.carbs], ['fat', totals.fat]].map(([key, grams]) => (
          <div key={key}>
            <b>{t('nutrition.grams', { n: decimal(grams, 0) })}</b>
            <small>{t(`nutrition.${key}`)}</small>
          </div>
        ))}
      </div>
      <p className="muted small">{t('nutrition.estimateNote')}</p>
    </section>
  );
}

function Water({ date, glasses, goal }) {
  const { setGlasses, t } = useApp();
  const shown = Math.max(goal, glasses);
  return (
    <section className="panel water">
      <div className="water-head">
        <h2><Droplets size={18} /> {t('nutrition.water')}</h2>
        <span className="muted">{t('nutrition.waterCount', { n: num(glasses), goal: num(goal), liters: decimal((glasses * GLASS_ML) / 1000, 2) })}</span>
      </div>
      <div className="glasses">
        {Array.from({ length: shown }, (_, i) => (
          <button key={i} className={i < glasses ? 'on' : ''} onClick={() => setGlasses(date, glasses === i + 1 ? i : i + 1)} aria-label={t('nutrition.glassN', { n: num(i + 1) })} aria-pressed={i < glasses}>
            <Droplets size={18} />
          </button>
        ))}
      </div>
      <div className="btns">
        <button className="btn ghost" disabled={!glasses} onClick={() => setGlasses(date, glasses - 1)}><Minus size={16} /> {t('nutrition.glassLess')}</button>
        <button className="btn" onClick={() => setGlasses(date, glasses + 1)}><Plus size={16} /> {t('nutrition.glassMore', { ml: num(GLASS_ML) })}</button>
      </div>
    </section>
  );
}

function MealSection({ meal, date, entries }) {
  const { lang, t, openModal, removeFood } = useApp();
  const { kcal } = totalsOf(entries);
  return (
    <section className="panel meal-section">
      <div className="meal-section-head">
        <h2>{t(`nutrition.meal.${meal}`)}</h2>
        {kcal > 0 && <span className="muted">{t('nutrition.kcalShort', { n: groupNumber(kcal) })}</span>}
        <button className="btn ghost sm" onClick={() => openModal({ type: 'food-add', meal, date })}><Plus size={15} /> {t('nutrition.add')}</button>
      </div>
      {entries.length === 0 ? (
        <p className="muted small">{t('nutrition.mealEmpty')}</p>
      ) : (
        <ul className="food-list">
          {entries.map((entry) => {
            const food = entry.foodId ? getFood(entry.foodId) : null;
            return (
              <li key={entry.id}>
                <span className="food-main">
                  <b>{entryName(entry, lang)}</b>
                  {food && <small>{entry.servings === 1 ? food.serving[lang] : `${num(decimal(entry.servings, 2))} × ${food.serving[lang]}`}</small>}
                </span>
                <span className="food-kcal">{groupNumber(entry.kcal)}</span>
                <button className="icon-btn sm" onClick={() => removeFood(entry.id)} aria-label={t('common.delete')}><Trash2 size={15} /></button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function WeekChart({ days, target, today }) {
  const { t } = useApp();
  const max = Math.max(1, target?.kcal ?? 0, ...days.map((d) => d.kcal));
  return (
    <section className="panel week-chart">
      <h2>{t('nutrition.week')}</h2>
      <div className="week-bars">
        {days.map((day) => (
          <div key={day.date} className={day.date === today ? 'is-today' : ''}>
            <span className="bar"><i style={{ height: day.kcal > 0 ? `max(4px, ${Math.round((day.kcal / max) * 100)}%)` : 0 }} /></span>
            <small>{formatDate(`${day.date}T12:00:00`, { weekday: 'narrow' })}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NutritionPage() {
  const { db, user, t } = useApp();
  const today = dayKey();
  const [date, setDate] = useState(today);
  const entries = entriesFor(db, user.id, date);
  const target = dailyTarget(user);

  return (
    <div className="stack narrow">
      <DaySwitch date={date} today={today} onChange={setDate} />
      <Summary totals={totalsOf(entries)} target={target} />
      <Water date={date} glasses={waterFor(db, user.id, date)} goal={waterGoal(user)} />
      <div className="section-title"><h2><UtensilsCrossed size={18} /> {t('nutrition.meals')}</h2></div>
      {MEAL_TYPES.map((meal) => (
        <MealSection key={meal} meal={meal} date={date} entries={entries.filter((e) => e.meal === meal)} />
      ))}
      <WeekChart days={recentDays(db, user.id, date)} target={target} today={today} />
    </div>
  );
}
