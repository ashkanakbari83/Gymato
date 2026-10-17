// Row of headline numbers. items: [{ value, label, suffix? }]
import { faNum } from '../../lib/format';

/** Three-up number strip. items: [{ value, label, suffix? }] */
export default function Metrics({ items }) {
  return (
    <section className="metrics">
      {items.map(({ value, label, suffix }) => (
        <div key={label}>
          <b>
            {faNum(value)}
            {suffix && <em>{suffix}</em>}
          </b>
          <small>{label}</small>
        </div>
      ))}
    </section>
  );
}
