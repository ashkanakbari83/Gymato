// Thin progress bar (0-100).
export default function ProgressBar({ value, spaced = false }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <span className={`bar${spaced ? ' spaced' : ''}`} role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${percent}%` }} />
    </span>
  );
}
