// Form controls. Every control can show a field error (already translated) under itself.

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
