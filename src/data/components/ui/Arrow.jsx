// Direction-aware arrows: "forward" points left in RTL (Persian) and right in LTR (English).
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export function ArrowForward(props) {
  const { lang } = useApp();
  return lang === 'fa' ? <ChevronLeft {...props} /> : <ChevronRight {...props} />;
}

export function ArrowBack(props) {
  const { lang } = useApp();
  return lang === 'fa' ? <ChevronRight {...props} /> : <ChevronLeft {...props} />;
}
