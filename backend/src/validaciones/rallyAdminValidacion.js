export function validarRallyAdmin(datos = {}) {
  const errores = [];

  const idRally = Number(datos.id_rally);
  if (!Number.isInteger(idRally) || idRally <= 0) {
    errores.push('El campo "id_rally" debe ser un número entero mayor a 0.');
  }

  if (!datos.nombre || typeof datos.nombre !== 'string' || !datos.nombre.trim()) {
    errores.push('El campo "nombre" es obligatorio.');
  }

  if (!datos.subtitulo || typeof datos.subtitulo !== 'string' || !datos.subtitulo.trim()) {
    errores.push('El campo "subtitulo" es obligatorio.');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      id_rally: idRally,
      nombre: (datos.nombre || '').trim(),
      subtitulo: (datos.subtitulo || '').trim(),
      en_carrera: typeof datos.en_carrera === 'string'
        ? datos.en_carrera.trim()
        : ''
    }
  };
}
