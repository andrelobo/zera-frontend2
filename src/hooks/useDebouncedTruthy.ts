import { useEffect, useState } from 'react';

export const useDebouncedTruthy = (value: boolean, delayMs = 400) => {
  const [debounced, setDebounced] = useState(false);

  useEffect(() => {
    if (!value) {
      setDebounced(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebounced(true);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debounced;
};

export default useDebouncedTruthy;
