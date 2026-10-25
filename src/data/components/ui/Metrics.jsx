// Row of headline numbers. items: [{ value, label, suffix? }]
import { num } from '../../lib/format.js';

/** Row of headline numbers. items: [{ value, label, suffix?, text? }]; `text` replaces the formatted number.
 *  `columns` fixes the grid (use 2 for long values such as prices). */
export default function Metrics({ items, columns }) {
  return (
    <section className="metrics" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoFlow: 'row' } : undefined}>
      {items.map(({ value, label, suffix, text }) => (
        <div key={label}>
          <b>
            {text ?? num(value)}
            {suffix && <em>{suffix}</em>}
          </b>
          <small>{label}</small>
        </div>
      ))}
    </section>
  );
}
