/**
 * Almacena los datos temporalmente y los sirve sin consultar la base de datos
 */

class CacheEnMemoria {
  constructor() {
    this.cache = new Map();
    this.tiemposExpiracion = new Map();
  }

  /**
   * Guardar datos en caché con tiempo de expiración
   * @param {string} clave - Identificador único del dato
   * @param {*} valor - Datos a cachear
   * @param {number} ttlSegundos - Tiempo de vida en segundos (por defecto 30s)
   */
  guardar(clave, valor, ttlSegundos = 60) {
    this.cache.set(clave, valor);
    this.tiemposExpiracion.set(clave, Date.now() + (ttlSegundos * 1000));
  }

  /**
   * Obtener datos del caché
   * @param {string} clave - Identificador del dato
   * @returns {*} Datos cacheados o null si expiró/no existe
   */
  obtener(clave) {
    const tiempoExpiracion = this.tiemposExpiracion.get(clave);
    
    // Verificar si expiró
    if (!tiempoExpiracion || Date.now() > tiempoExpiracion) {
      this.eliminar(clave);
      return null;
    }

    return this.cache.get(clave);
  }

  /**
   * Verificar si existe y es válido un dato en caché
   * @param {string} clave - Identificador del dato
   * @returns {boolean}
   */
  existe(clave) {
    return this.obtener(clave) !== null;
  }

  /**
   * Eliminar un dato específico del caché
   * @param {string} clave - Identificador del dato
   */
  eliminar(clave) {
    this.cache.delete(clave);
    this.tiemposExpiracion.delete(clave);
  }

  /**
   * Limpiar todo el caché
   */
  limpiarTodo() {
    this.cache.clear();
    this.tiemposExpiracion.clear();
  }

  /**
   * Obtener estadísticas del caché
   * @returns {Object}
   */
  obtenerEstadisticas() {
    return {
      elementos_totales: this.cache.size,
      elementos_validos: Array.from(this.tiemposExpiracion.entries())
        .filter(([, expiracion]) => Date.now() <= expiracion).length
    };
  }
}

// Instancia única (Singleton)
const cache = new CacheEnMemoria();

export default cache;