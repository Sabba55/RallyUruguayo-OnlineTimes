export function validarTramoAdmin(datos = {}) {
  const errores = [];

  const pe = Number(datos.pe);
  if (!Number.isInteger(pe) || pe < 0) {
    errores.push('El campo "pe" debe ser un número entero mayor o igual a 0.');
  }

  const etapaOriginal = Number(datos.etapa);
  if (!Number.isInteger(etapaOriginal) || ![1, 2].includes(etapaOriginal)) {
    errores.push('El campo "etapa" solo puede ser 1 o 2.');
  }

  const camposObligatorios = ['kms', 'hora'];
  camposObligatorios.forEach((campo) => {
    if (!datos[campo] || typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      errores.push(`El campo "${campo}" es obligatorio.`);
    }
  });

  let etapa = etapaOriginal;
  let desde = String(datos.desde || '').trim();
  let hasta = String(datos.hasta || '').trim();
  const kms = String(datos.kms || '').trim();
  const hora = String(datos.hora || '').trim();
  const estado = String(datos.estado || '').trim();

  if (pe === 0) {
    etapa = 1;
    desde = 'Shakedown';
    hasta = '';
  } else if (!desde) {
    errores.push('El campo "desde" es obligatorio.');
  }

  if (pe > 0 && (/shakedown/i.test(desde) || /shakedown/i.test(hasta))) {
    errores.push('Un tramo normal no puede identificarse como Shakedown. El Shakedown siempre debe ser PE 0.');
  }

  if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
    errores.push('El campo "hora" debe tener formato HH:MM.');
  }

  if (kms && !/^\d{1,2},\d{2}$/.test(kms)) {
    errores.push('El campo "kms" debe tener formato KK,MM.');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      pe,
      etapa,
      desde,
      hasta,
      kms,
      hora,
      estado
    }
  };
}
