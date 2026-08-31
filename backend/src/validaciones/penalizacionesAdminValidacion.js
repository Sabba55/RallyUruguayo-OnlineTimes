export function validarPenalizacionAdmin(datos = {}) {
  const errores = [];

  const idPenal = datos.id_penal === undefined || datos.id_penal === null || datos.id_penal === ''
    ? null
    : Number(datos.id_penal);
  if (idPenal !== null && (!Number.isInteger(idPenal) || idPenal <= 0)) {
    errores.push('El campo "id_penal" debe ser un número entero mayor a 0.');
  }

  const nro = Number(datos.nro);
  if (!Number.isInteger(nro) || nro <= 0) {
    errores.push('El campo "nro" debe ser un número entero mayor a 0.');
  }

  const peOcurrido = Number(datos.peocurrido);
  if (!Number.isInteger(peOcurrido) || peOcurrido < 0) {
    errores.push('El campo "peocurrido" debe ser un número entero mayor o igual a 0.');
  }

  const camposObligatorios = ['tiempo', 'motivo', 'control'];
  camposObligatorios.forEach((campo) => {
    if (!datos[campo] || typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      errores.push(`El campo "${campo}" es obligatorio.`);
    }
  });

  const tiempo = String(datos.tiempo || '').trim();
  if (tiempo && !/^\d{1,2}:\d{2}\.\d$/.test(tiempo)) {
    errores.push('El campo "tiempo" debe respetar el formato mm:ss.d.');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      id_penal: idPenal,
      nro,
      peocurrido: peOcurrido,
      tiempo,
      motivo: (datos.motivo || '').trim(),
      control: (datos.control || '').trim()
    }
  };
}
