// URL base de la API (backend)
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Obtener todos los tramos
 */
export async function obtenerTramos() {
  try {
    const respuesta = await fetch(`${API_URL}/tramos`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener tramos');
  } catch (error) {
    console.error('Error al obtener tramos:', error);
    throw error;
  }
}

/**
 * Obtener informacion del rally
 */
export async function obtenerInfoRally() {
  try {
    const respuesta = await fetch(`${API_URL}/rally`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener info del rally');
  } catch (error) {
    console.error('Error al obtener info del rally:', error);
    throw error;
  }
}

/**
 * Obtener todos los tiempos de los pilotos
 */
export async function obtenerTiempos() {
  try {
    const respuesta = await fetch(`${API_URL}/tiempos`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener tiempos');
  } catch (error) {
    console.error('Error al obtener tiempos:', error);
    throw error;
  }
}

/**
 * Obtener lista completa de inscriptos
 */
export async function obtenerInscriptos() {
  try {
    const respuesta = await fetch(`${API_URL}/inscriptos`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener inscriptos');
  } catch (error) {
    console.error('Error al obtener inscriptos:', error);
    throw error;
  }
}

/**
 * Obtener todas las penalizaciones
 */
export async function obtenerPenalizaciones() {
  try {
    const respuesta = await fetch(`${API_URL}/penalizaciones`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener penalizaciones');
  } catch (error) {
    console.error('Error al obtener penalizaciones:', error);
    throw error;
  }
}

/**
 * Obtener orden de largada de la Etapa 1
 */
export async function obtenerHorariosEtapa1() {
  try {
    const respuesta = await fetch(`${API_URL}/horarios/etapa1`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener horarios de Etapa 1');
  } catch (error) {
    console.error('Error al obtener horarios de Etapa 1:', error);
    throw error;
  }
}

/**
 * Obtener orden de largada de la Etapa 2
 */
export async function obtenerHorariosEtapa2() {
  try {
    const respuesta = await fetch(`${API_URL}/horarios/etapa2`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener horarios de Etapa 2');
  } catch (error) {
    console.error('Error al obtener horarios de Etapa 2:', error);
    throw error;
  }
}

/**
 * Obtener resultados del Shakedown
 */
export async function obtenerShakedown() {
  try {
    const respuesta = await fetch(`${API_URL}/shakedown`);
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || 'Error al obtener datos del Shakedown');
  } catch (error) {
    console.error('Error al obtener datos del Shakedown:', error);
    throw error;
  }
}

async function obtenerEndpointProcesado(path, mensajeError) {
  try {
    const respuesta = await fetch(`${API_URL}${path}`, {
      cache: 'no-store'
    });
    const data = await respuesta.json();

    if (data.exito) {
      return data.datos;
    }

    throw new Error(data.mensaje || mensajeError);
  } catch (error) {
    console.error(mensajeError, error);
    throw error;
  }
}

export async function obtenerTiemposGeneralPorPE(pe) {
  return obtenerEndpointProcesado(
    `/v2/tiempos/general/pe/${pe}`,
    'Error al obtener tiempos generales procesados'
  );
}

export async function obtenerTiemposClasesPorPE(pe) {
  return obtenerEndpointProcesado(
    `/v2/tiempos/clases/pe/${pe}`,
    'Error al obtener tiempos por clases procesados'
  );
}

export async function obtenerTiemposEtapa2PorPE(pe) {
  return obtenerEndpointProcesado(
    `/v2/tiempos/etapa2/pe/${pe}`,
    'Error al obtener tiempos de etapa 2 procesados'
  );
}

export async function obtenerTramosCarrera() {
  return obtenerEndpointProcesado(
    '/v2/tramos/carrera',
    'Error al obtener tramos de carrera'
  );
}

export async function obtenerShakedownProcesado() {
  return obtenerEndpointProcesado(
    '/v2/shakedown',
    'Error al obtener datos procesados del shakedown'
  );
}

export async function obtenerTarjetaGanadores() {
  return obtenerEndpointProcesado(
    '/v2/tarjeta-ganadores',
    'Error al obtener datos de la tarjeta de ganadores'
  );
}

export async function obtenerCabeceraDashboard() {
  return obtenerEndpointProcesado(
    '/v2/cabecera-dashboard',
    'Error al obtener datos de la cabecera del dashboard'
  );
}
