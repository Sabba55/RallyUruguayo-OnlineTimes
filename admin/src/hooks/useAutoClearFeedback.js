import { useEffect } from 'react';

export function useAutoClearFeedback({ mensaje, error, setMensaje, setError, delay = 10000 }) {
  useEffect(() => {
    if (!mensaje && !error) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setMensaje('');
      setError('');
    }, delay);

    return () => clearTimeout(timeout);
  }, [mensaje, error, setMensaje, setError, delay]);
}
