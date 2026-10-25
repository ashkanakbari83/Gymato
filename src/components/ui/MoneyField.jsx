// Price input: digits are grouped with thousands separators as you type and the currency ("Toman") is
// always visible. The value passed to onChange is a plain number (or '' when empty).
import { useApp } from '../../context/AppContext.jsx';
import { locale, parseMoney } from '../../lib/format.js';

export default function MoneyField({ label, value, onChange, error, hint, ...inputProps }) {
  const { t } = useApp();
  const digits = value === '' || value == null ? '' : String(value);
  const shown = digits ? Number(digits).toLocaleString(locale()) : '';

  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <span className="money">
        <input
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder={Number(0).toLocaleString(locale())}
          value={shown}
          onChange={(e) => {
            const clean = parseMoney(e.target.value);
            onChange(clean === '' ? '' : Number(clean));
          }}
          {...inputProps}
        />
        <em>{t('common.currency')}</em>
      </span>
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}
