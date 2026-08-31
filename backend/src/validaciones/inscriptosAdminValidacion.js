function normalizarNacionalidades(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function validarInscriptosAdmin(datos = {}) {
  const errores = [];

  const nro = Number(datos.nro);
  if (!Number.isInteger(nro) || nro <= 0) {
    errores.push('El campo "nro" debe ser un numero entero mayor a 0.');
  }

  const nroOriginalCrudo = datos.nroOriginal;
  let nroOriginal = null;
  if (nroOriginalCrudo !== undefined && nroOriginalCrudo !== null && String(nroOriginalCrudo).trim() !== '') {
    nroOriginal = Number(nroOriginalCrudo);

    if (!Number.isInteger(nroOriginal) || nroOriginal <= 0) {
      errores.push('El campo "nroOriginal" debe ser un numero entero mayor a 0 cuando se informa.');
    }
  }

  const camposTextoObligatorios = ['piloto', 'navegante', 'vehiculo', 'clase', 'nac'];

  camposTextoObligatorios.forEach((campo) => {
    if (!datos[campo] || typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      errores.push(`El campo "${campo}" es obligatorio.`);
    }
  });

  const nacNormalizada = normalizarNacionalidades(datos.nac);
  if (nacNormalizada && !/^([A-Z]{3})(\s+[A-Z]{3})*$/.test(nacNormalizada)) {
    errores.push('El campo "nac" debe usar codigos de 3 letras, por ejemplo "ARG" o "ARG ARG".');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      nro,
      nroOriginal,
      piloto: (datos.piloto || '').trim(),
      navegante: (datos.navegante || '').trim(),
      vehiculo: (datos.vehiculo || '').trim(),
      clase: (datos.clase || '').trim(),
      nac: nacNormalizada
    }
  };
}

export function validarLoteInscriptosAdmin(items) {
  if (!Array.isArray(items)) {
    return {
      esValido: false,
      errores: ['El cuerpo debe contener un arreglo en la propiedad "items".'],
      itemsNormalizados: []
    };
  }

  const errores = [];
  const itemsNormalizados = [];
  const numerosVistos = new Set();

  items.forEach((item, index) => {
    const validacion = validarInscriptosAdmin(item);

    if (!validacion.esValido) {
      validacion.errores.forEach((error) => {
        errores.push(`Fila ${index + 1}: ${error}`);
      });
      return;
    }

    const nro = validacion.datosNormalizados.nro;
    if (numerosVistos.has(nro)) {
      errores.push(`Fila ${index + 1}: el numero ${nro} esta repetido dentro del lote.`);
      return;
    }

    numerosVistos.add(nro);
    itemsNormalizados.push(validacion.datosNormalizados);
  });

  return {
    esValido: errores.length === 0,
    errores,
    itemsNormalizados
  };
}
