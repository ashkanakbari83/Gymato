// Form controls. Every control can show a field error (already translated) under itself.
import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const ErrorText = ({ error, id }) => (error ? <small id={id} className="field-error">{error}</small> : null);

/** The wiring every control shares: `name` lets an error summary jump to it, and an error is announced with it. */
export function useFieldA11y(error) {
  const errorId = useId();
  return { errorId, control: error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {} };
}

export function Field({ label, value, onChange, type = 'text', error, hint, name, ...inputProps }) {
  const { errorId, control } = useFieldA11y(error);
  return (
    <label className={`field ${error ? 'invalid' : ''}`} data-field={name}>
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...control} {...inputProps} />
      {hint && !error && <small className="field-hint">{hint}</small>}
      <ErrorText error={error} id={errorId} />
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

export function TextArea({ label, value, onChange, error, rows = 3, name, hint, ...rest }) {
  const { errorId, control } = useFieldA11y(error);
  return (
    <label className={`field ${error ? 'invalid' : ''}`} data-field={name}>
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...control} {...rest} />
      {hint && !error && <small className="field-hint">{hint}</small>}
      <ErrorText error={error} id={errorId} />
    </label>
  );
}

/** options: [{ value, label }] */
export function SelectField({ label, value, onChange, options, error, name, ...rest }) {
  const { errorId, control } = useFieldA11y(error);
  return (
    <label className={`field ${error ? 'invalid' : ''}`} data-field={name}>
      <span>{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...control} {...rest}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ErrorText error={error} id={errorId} />
    </label>
  );
}

/** Pick-one (`multi` false) or pick-many chips. options: [{ value, label }] */
export function ChipSelect({ label, options, value, onChange, multi = false, error, name }) {
  const isOn = (v) => (multi ? value.includes(v) : value === v);
  const toggle = (v) => onChange(multi ? (value.includes(v) ? value.filter((x) => x !== v) : [...value, v]) : v);
  return (
    <div className={`field ${error ? 'invalid' : ''}`} data-field={name}>
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

/** Pick exactly one of a few clear choices (radio buttons drawn as large tappable rows). options: [{ value, label, hint }] */
export function RadioCards({ label, options, value, onChange, error, name }) {
  const groupId = useId();
  const { errorId } = useFieldA11y(error);
  return (
    <div className={`field ${error ? 'invalid' : ''}`} data-field={name} role="radiogroup" aria-labelledby={groupId} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
      <span id={groupId}>{label}</span>
      <div className="radio-cards">
        {options.map((option) => (
          <label key={String(option.value)} className={value === option.value ? 'on' : ''}>
            <input type="radio" name={groupId} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
            {option.hint && <small>{option.hint}</small>}
          </label>
        ))}
      </div>
      <ErrorText error={error} id={errorId} />
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
