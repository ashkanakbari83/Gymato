// Form controls. Every control can show a field error (already translated) under itself.
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const ErrorText = ({ error }) => (error ? <small className="field-error">{error}</small> : null);

export function Field({ label, value, onChange, type = 'text', error, hint, ...inputProps }) {
  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...inputProps} />
      {hint && !error && <small className="field-hint">{hint}</small>}
      <ErrorText error={error} />
    </label>
  );
}

/** Password input with a show / hide button. Direction follows the page, like every other field. */
export function PasswordField({ label, value, onChange, error, hint, ...inputProps }) {
  const { t } = useApp();
  const [shown, setShown] = useState(false);
  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <span className="pw">
        <input type={shown ? 'text' : 'password'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...inputProps} />
        <button type="button" className="pw-toggle" aria-label={t(shown ? 'auth.hidePassword' : 'auth.showPassword')} onClick={() => setShown((v) => !v)}>
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {hint && !error && <small className="field-hint">{hint}</small>}
      <ErrorText error={error} />
    </label>
  );
}

export function TextArea({ label, value, onChange, error, rows = 3, ...rest }) {
  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest} />
      <ErrorText error={error} />
    </label>
  );
}

/** options: [{ value, label }] */
export function SelectField({ label, value, onChange, options, error, ...rest }) {
  return (
    <label className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorText error={error} />
    </label>
  );
}

/** Pick-one (`multi` false) or pick-many chips. options: [{ value, label }] */
export function ChipSelect({ label, options, value, onChange, multi = false, error }) {
  const isOn = (v) => (multi ? value.includes(v) : value === v);
  const toggle = (v) => onChange(multi ? (value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) : v);
  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <span>{label}</span>
      <div className="chip-select">
        {options.map((option) => (
          <button type="button" key={option.value} className={isOn(option.value) ? 'on' : ''} aria-pressed={isOn(option.value)} onClick={() => toggle(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
      <ErrorText error={error} />
    </div>
  );
}

/** Two-or-three-way switch. options: [{ value, label }] */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((option) => (
        <button key={option.value} type="button" className={value === option.value ? 'on' : ''} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
