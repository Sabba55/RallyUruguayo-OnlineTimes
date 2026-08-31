function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const FORMATOS_SHAKEDOWN = [
  ['hlv1', /^(?:\d{1,2}):\d{2}$/],
  ['tv1', /^\d{1,2}:\d{2}:\d{2}\.\d$/],
  ['v1', /^\d{1,2}:\d{2}\.\d$/],
  ['hlv2', /^(?:\d{1,2}):\d{2}$/],
  ['tv2', /^\d{1,2}:\d{2}:\d{2}\.\d$/],
  ['v2', /^\d{1,2}:\d{2}\.\d$/],
  ['hlv3', /^(?:\d{1,2}):\d{2}$/],
  ['tv3', /^\d{1,2}:\d{2}:\d{2}\.\d$/],
  ['v3', /^\d{1,2}:\d{2}\.\d$/]
];

export function validarShakedownAdmin(datos = {}) {
  const errores = [];

  const nro = Number(datos.nro);
  if (!Number.isInteger(nro) || nro <= 0) {
    errores.push('El campo "nro" debe ser un numero entero mayor a 0.');
  }

  FORMATOS_SHAKEDOWN.forEach(([campo, regex]) => {
    const valor = normalizarTexto(datos[campo]);
    if (valor && !regex.test(valor)) {
      errores.push(`El campo "${campo}" no respeta el formato esperado.`);
    }
  });

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      nro,
      hlv1: normalizarTexto(datos.hlv1),
      tv1: normalizarTexto(datos.tv1),
      v1: normalizarTexto(datos.v1),
      hlv2: normalizarTexto(datos.hlv2),
      tv2: normalizarTexto(datos.tv2),
      v2: normalizarTexto(datos.v2),
      hlv3: normalizarTexto(datos.hlv3),
      tv3: normalizarTexto(datos.tv3),
      v3: normalizarTexto(datos.v3)
    }
  };
}

export function validarLoteShakedownAdmin(items = []) {
  const errores = [];

  if (!Array.isArray(items) || items.length === 0) {
    return {
      esValido: false,
      errores: ['El lote de Shakedown debe contener al menos un registro.'],
      itemsNormalizados: []
    };
  }

  const itemsNormalizados = items.map((item, index) => {
    const validacion = validarShakedownAdmin(item);
    if (!validacion.esValido) {
      errores.push(`Fila ${index + 1}: ${validacion.errores.join(' ')}`);
      return null;
    }
    return validacion.datosNormalizados;
  }).filter(Boolean);

  return {
    esValido: errores.length === 0,
    errores,
    itemsNormalizados
  };
}
