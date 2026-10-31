// Toast message state with auto-dismiss. `tone` is 'status' (polite) or 'alert' (an error the person must hear now).
import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(duration = 2600) {
  const [toast, setToast] = useState({ text: '', tone: 'status' });
  const timer = useRef();

  const notify = useCallback(
    (text, tone = 'status') => {
      clearTimeout(timer.current);
      setToast({ text, tone });
      timer.current = setTimeout(() => setToast({ text: '', tone: 'status' }), duration);
    },
    [duration],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast.text, notify, toast.tone];
}
