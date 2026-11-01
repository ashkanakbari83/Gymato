import { Loader2 } from 'lucide-react';

/** Small rotating indicator for a button that is working. Decorative: the button carries aria-busy. */
export default function Spinner({ size = 16 }) {
  return <Loader2 className="spin" size={size} aria-hidden="true" />;
}
