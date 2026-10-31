import { BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Sheet from '../components/ui/Sheet.jsx';

/**
 * How-to steps for the current exercise. Tall screens show them inline; short phones show a
 * button instead (opens a sheet) so the player never needs scrolling. CSS picks which one.
 */
export default function HowTo({ title, steps }) {
  const { openModal, t } = useApp();

  return (
    <>
      <div className="how-inline"><HowSteps steps={steps} /></div>
      <button className="how-btn" onClick={() => openModal({ type: 'how-to', title, steps })}>
        <BookOpen size={16} /> {t('ex.howTo')}
      </button>
    </>
  );
}

const HowSteps = ({ steps }) => (
  <ol className="how-steps">
    {steps.map((step) => (
      <li key={step}>{step}</li>
    ))}
  </ol>
);

/** The same steps as a sheet (a registry modal, so Back closes it). */
export function HowToModal({ title, steps }) {
  return (
    <Sheet title={title}>
      <HowSteps steps={steps} />
    </Sheet>
  );
}
