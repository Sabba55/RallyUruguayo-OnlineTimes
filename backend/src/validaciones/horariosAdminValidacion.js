function normalizarNacionalidades(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function validarHora(valor) {
  return /^\d{1,2}:\d{2}$/.test(String(valor || '').trim());
}

export function validarHorarioAdmin(datos = {}) {
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

  const etapa = Number(datos.etapa);
  if (!Number.isInteger(etapa) || etapa <= 0) {
    errores.push('El campo "etapa" debe ser un numero entero mayor a 0.');
  }

  const etapaOriginalCruda = datos.etapaOriginal;
  let etapaOriginal = null;
  if (etapaOriginalCruda !== undefined && etapaOriginalCruda !== null && String(etapaOriginalCruda).trim() !== '') {
    etapaOriginal = Number(etapaOriginalCruda);
    if (!Number.isInteger(etapaOriginal) || etapaOriginal <= 0) {
      errores.push('El campo "etapaOriginal" debe ser un numero entero mayor a 0 cuando se informa.');
    }
  }

  const camposTextoObligatorios = ['piloto', 'navegante', 'vehiculo', 'clase', 'nac', 'hora'];

  camposTextoObligatorios.forEach((campo) => {
    if (!datos[campo] || typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      errores.push(`El campo "${campo}" es obligatorio.`);
    }
  });

  const nacNormalizada = normalizarNacionalidades(datos.nac);
  if (nacNormalizada && !/^([A-Z]{3})(\s+[A-Z]{3})*$/.test(nacNormalizada)) {
    errores.push('El campo "nac" debe usar codigos de 3 letras, por ejemplo "ARG" o "ARG ARG".');
  }

  if (!validarHora(datos.hora)) {
    errores.push('El campo "hora" debe respetar el formato HH:MM.');
  }

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      nro,
      nroOriginal,
      etapa,
      etapaOriginal,
      piloto: (datos.piloto || '').trim(),
      navegante: (datos.navegante || '').trim(),
      vehiculo: (datos.vehiculo || '').trim(),
      clase: (datos.clase || '').trim(),
      nac: nacNormalizada,
      hora: (datos.hora || '').trim()
    }
  };
}

export function validarLoteHorariosAdmin(items, etapa) {
  if (!Array.isArray(items)) {
    return {
      esValido: false,
      errores: ['El cuerpo debe contener un arreglo en la propiedad "items".'],
      itemsNormalizados: []
    };
  }

  const etapaNumero = Number(etapa);
  if (!Number.isInteger(etapaNumero) || etapaNumero <= 0) {
    return {
      esValido: false,
      errores: ['La etapa para la carga masiva es invalida.'],
      itemsNormalizados: []
    };
  }

  const errores = [];
  const itemsNormalizados = [];
  const clavesVistas = new Set();

  items.forEach((item, index) => {
    const validacion = validarHorarioAdmin({
      ...item,
      etapa: etapaNumero
    });

    if (!validacion.esValido) {
      validacion.errores.forEach((error) => {
        errores.push(`Fila ${index + 1}: ${error}`);
      });
      return;
    }

    const clave = `${validacion.datosNormalizados.etapa}-${validacion.datosNormalizados.nro}`;
    if (clavesVistas.has(clave)) {
      errores.push(`Fila ${index + 1}: el numero ${validacion.datosNormalizados.nro} esta repetido dentro del lote de la etapa ${etapaNumero}.`);
      return;
    }

    clavesVistas.add(clave);
    itemsNormalizados.push(validacion.datosNormalizados);
  });

  return {
    esValido: errores.length === 0,
    errores,
    itemsNormalizados
  };
}
