import { useEffect } from 'react';

export function useUnsavedChangesWarning(hayCambiosPendientes) {
  useEffect(() => {
    function manejarBeforeUnload(event) {
      if (!hayCambiosPendientes) {
        return undefined;
      }

      event.preventDefault();
      event.returnValue = '';
      return '';
    }

    window.addEventListener('beforeunload', manejarBeforeUnload);
    return () => window.removeEventListener('beforeunload', manejarBeforeUnload);
  }, [hayCambiosPendientes]);
}
