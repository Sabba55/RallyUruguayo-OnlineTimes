import React, { createContext, useContext, useEffect, useState } from 'react';

const INTERVALO_REFRESH_SEGUNDOS = 30;

const GlobalRefreshContext = createContext(null);

function GlobalRefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(INTERVALO_REFRESH_SEGUNDOS);

  useEffect(() => {
    let segundos = INTERVALO_REFRESH_SEGUNDOS;

    const intervalo = setInterval(() => {
      segundos -= 1;

      if (segundos <= 0) {
        setRefreshKey((prev) => prev + 1);
        segundos = INTERVALO_REFRESH_SEGUNDOS;
      }

      setSegundosRestantes(segundos);
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  const forzarRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setSegundosRestantes(INTERVALO_REFRESH_SEGUNDOS);
  };

  return (
    <GlobalRefreshContext.Provider
      value={{
        refreshKey,
        segundosRestantes,
        intervaloSegundos: INTERVALO_REFRESH_SEGUNDOS,
        forzarRefresh
      }}
    >
      {children}
    </GlobalRefreshContext.Provider>
  );
}

function useGlobalRefresh() {
  const context = useContext(GlobalRefreshContext);

  if (!context) {
    throw new Error('useGlobalRefresh debe usarse dentro de GlobalRefreshProvider');
  }

  return context;
}

export { GlobalRefreshProvider, useGlobalRefresh };
