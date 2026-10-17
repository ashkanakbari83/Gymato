// Toast message state with auto-dismiss.
import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast(duration = 2600) {
  const [message, setMessage] = useState('');
  const timer = useRef();

  const notify = useCallback(
    (text) => {
      clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(''), duration);
    },
    [duration],
  );

  useEffect(() => () => clearTimeout(timer.current), []);
  return [message, notify];
}
