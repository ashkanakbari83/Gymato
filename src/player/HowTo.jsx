import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import Sheet from '../components/ui/Sheet.jsx';

/**
 * How-to steps for the current exercise. Tall screens show them inline; short phones show a
 * button instead (opens a sheet) so the player never needs scrolling. CSS picks which one.
 */
export default function HowTo({ title, steps }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const list = (
    <ol className="how-steps">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );

  return (
    <>
      <div className="how-inline">{list}</div>
      <button className="how-btn" onClick={() => setOpen(true)}>
        <BookOpen size={16} /> {t('ex.howTo')}
      </button>
      {open && (
        <Sheet title={title} onClose={() => setOpen(false)}>
          {list}
        </Sheet>
      )}
    </>
  );
}
