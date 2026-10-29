// Add food to a meal: pick from the list (search, recent foods first) and set the amount, or type your own.
// The sheet stays open after each item so a whole meal can be logged in one go.
import { Check, Minus, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Field, Segmented } from '../components/ui/Field.jsx';
import Sheet from '../components/ui/Sheet.jsx';
import { useApp } from '../context/AppContext.jsx';
import { foods, getFood } from '../data/foods.js';
import { MEAL_TYPES, recentFoodIds } from '../lib/domain/nutrition.js';
import { decimal, groupNumber, num } from '../lib/format.js';

/** Which meal fits the time of day, for when the sheet is opened without one. */
export const mealForHour = (hour) => (hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : hour < 21 ? 'dinner' : 'snack');

const EMPTY_CUSTOM = { name: '', kcal: '', protein: '', carbs: '', fat: '' };

export default function FoodModal({ meal: initialMeal, date }) {
  const { db, user, lang, t, addFood } = useApp();
  const [meal, setMeal] = useState(initialMeal ?? mealForHour(new Date().getHours()));
  const [mode, setMode] = useState('list');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [servings, setServings] = useState(1);
  const [custom, setCustom] = useState(EMPTY_CUSTOM);
  const [errors, setErrors] = useState({});
  const [added, setAdded] = useState(0);

  const recent = useMemo(() => recentFoodIds(db, user.id).map(getFood).filter(Boolean), [db, user.id]);
  const needle = query.trim().toLowerCase();
  const shown = needle ? foods.filter((f) => f.name.fa.includes(needle) || f.name.en.toLowerCase().includes(needle)) : foods;
  const food = selected ? getFood(selected) : null;

  const logSelected = () => {
    if (addFood({ date, meal, foodId: food.id, servings }).ok) {
      setAdded((n) => n + 1);
      setSelected(null);
      setServings(1);
    }
  };
  const logCustom = () => {
    const result = addFood({ date, meal, ...custom });
    if (result.ok) {
      setAdded((n) => n + 1);
      setCustom(EMPTY_CUSTOM);
      setErrors({});
    } else if (result.fields) setErrors(result.fields);
  };
  const setField = (key) => (value) => {
    setCustom((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const fieldError = (key) => (errors[key] ? t(`field.${errors[key]}`) : undefined);

  const FoodRow = ({ item }) => (
    <button className="food-pick" onClick={() => { setSelected(item.id); setServings(1); }}>
      <span className="food-main">
        <b>{item.name[lang]}</b>
        <small>{item.serving[lang]}</small>
      </span>
      <span className="food-kcal">{groupNumber(item.kcal)}</span>
    </button>
  );

  return (
    <Sheet title={t('food.title')}>
      <Segmented value={meal} onChange={setMeal} options={MEAL_TYPES.map((m) => ({ value: m, label: t(`nutrition.meal.${m}`) }))} />
      {added > 0 && <p className="added-note"><Check size={15} /> {t('food.addedCount', { n: num(added) })}</p>}

      {food ? (
        <section className="food-detail">
          <h3>{food.name[lang]}</h3>
          <p className="muted">{food.serving[lang]}</p>
          <div className="stepper">
            <button className="icon-btn" disabled={servings <= 0.5} onClick={() => setServings((s) => Math.max(0.5, s - 0.5))} aria-label={t('food.less')}><Minus size={18} /></button>
            <div>
              <b>{num(decimal(servings, 1))}</b>
              <small>{t('food.servings')}</small>
            </div>
            <button className="icon-btn" disabled={servings >= 20} onClick={() => setServings((s) => Math.min(20, s + 0.5))} aria-label={t('food.more')}><Plus size={18} /></button>
          </div>
          <div className="nutri-macros">
            <div><b>{groupNumber(Math.round(food.kcal * servings))}</b><small>{t('nutrition.kcalUnit')}</small></div>
            <div><b>{t('nutrition.grams', { n: decimal(food.protein * servings, 0) })}</b><small>{t('nutrition.protein')}</small></div>
            <div><b>{t('nutrition.grams', { n: decimal(food.carbs * servings, 0) })}</b><small>{t('nutrition.carbs')}</small></div>
            <div><b>{t('nutrition.grams', { n: decimal(food.fat * servings, 0) })}</b><small>{t('nutrition.fat')}</small></div>
          </div>
          <div className="btns stack-btns">
            <button className="btn" onClick={logSelected}><Plus size={16} /> {t('food.log', { meal: t(`nutrition.meal.${meal}`) })}</button>
            <button className="btn ghost" onClick={() => setSelected(null)}>{t('common.back')}</button>
          </div>
        </section>
      ) : (
        <>
          <Segmented value={mode} onChange={setMode} options={[{ value: 'list', label: t('food.tabList') }, { value: 'custom', label: t('food.tabCustom') }]} />
          {mode === 'list' ? (
            <>
              <div className="search-box">
                <Search size={18} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('food.search')} />
              </div>
              {!needle && recent.length > 0 && (
                <section>
                  <h3 className="food-group">{t('food.recent')}</h3>
                  <div className="food-picks">{recent.map((item) => <FoodRow key={`r-${item.id}`} item={item} />)}</div>
                </section>
              )}
              <section>
                {!needle && <h3 className="food-group">{t('food.all')}</h3>}
                <div className="food-picks">{shown.map((item) => <FoodRow key={item.id} item={item} />)}</div>
                {!shown.length && <p className="muted">{t('food.none')}</p>}
              </section>
              <p className="muted small">{t('nutrition.estimateNote')}</p>
            </>
          ) : (
            <section className="food-custom">
              <Field label={t('food.name')} value={custom.name} onChange={setField('name')} error={fieldError('name')} maxLength={80} />
              <Field label={t('food.kcalTotal')} type="number" inputMode="numeric" min="0" value={custom.kcal} onChange={setField('kcal')} error={fieldError('kcal')} />
              <div className="form-grid">
                <Field label={t('food.proteinG')} type="number" inputMode="decimal" min="0" value={custom.protein} onChange={setField('protein')} />
                <Field label={t('food.carbsG')} type="number" inputMode="decimal" min="0" value={custom.carbs} onChange={setField('carbs')} />
                <Field label={t('food.fatG')} type="number" inputMode="decimal" min="0" value={custom.fat} onChange={setField('fat')} />
              </div>
              <button className="btn wide" onClick={logCustom}><Plus size={16} /> {t('food.log', { meal: t(`nutrition.meal.${meal}`) })}</button>
            </section>
          )}
        </>
      )}
    </Sheet>
  );
}
