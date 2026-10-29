// On/off setting row: label (and optional hint) on one side, a switch on the other.
export default function Switch({ label, hint, checked, onChange, disabled = false }) {
  return (
    <label className={`switch-row ${disabled ? 'is-disabled' : ''}`}>
      <span className="switch-text">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked && !disabled} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <i className="switch-track" aria-hidden="true" />
    </label>
  );
}
