// Row of headline numbers. items: [{ value, label, suffix? }]
import { num } from '../../lib/format.js';

/** Three-up number strip. items: [{ value, label, suffix? }] */
export default function Metrics({ items }) {
  return (
    <section className="metrics">
      {items.map(({ value, label, suffix }) => (
        <div key={label}>
          <b>
            {num(value)}
            {suffix && <em>{suffix}</em>}
          </b>
          <small>{label}</small>
        </div>
      ))}
    </section>
  );
}
