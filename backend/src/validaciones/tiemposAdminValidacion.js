function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarFormatoHoraControl(valor) {
  return valor === '' || /^\d{1,2}:\d{2}$/.test(valor);
}

function validarFormatoTaqueo(valor) {
  return valor === '' || /^\d{1,2}:\d{2}:\d{2}\.\d{1,3}$/.test(valor);
}

function validarFormatoTiempoPE(valor) {
  return valor === '' || /^\d{1,2}:\d{2}\.\d{3}$/.test(valor);
}

function extraerRegistrosPorPE(datos = {}) {
  const mapa = new Map();

  Object.entries(datos).forEach(([clave, valor]) => {
    const coincidencia = clave.match(/^(hlpe|tpe|pe)(\d+)$/i);
    if (!coincidencia) {
      return;
    }

    const [, tipo, peTexto] = coincidencia;
    const pe = Number(peTexto);
    if (!Number.isInteger(pe) || pe <= 0) {
      return;
    }

    if (!mapa.has(pe)) {
      mapa.set(pe, { pe, hlpe: '', tpe: '', pe_tiempo: '' });
    }

    const registro = mapa.get(pe);
    const valorNormalizado = normalizarTexto(valor);

    if (tipo.toLowerCase() === 'hlpe') {
      registro.hlpe = valorNormalizado;
    } else if (tipo.toLowerCase() === 'tpe') {
      registro.tpe = valorNormalizado;
    } else if (tipo.toLowerCase() === 'pe') {
      registro.pe_tiempo = valorNormalizado;
    }
  });

  return [...mapa.values()]
    .sort((a, b) => a.pe - b.pe)
    .filter((registro) => registro.hlpe || registro.tpe || registro.pe_tiempo);
}

export function validarTiempoCompetidorAdmin(datos = {}) {
  const errores = [];
  const nro = Number(datos.nro);
  const finalizo = normalizarTexto(datos.finalizo);
  const registros = extraerRegistrosPorPE(datos);

  if (!Number.isInteger(nro) || nro <= 0) {
    errores.push('El campo "nro" debe ser un numero entero mayor a 0.');
  }

  if (finalizo && !/^(si|no)$/i.test(finalizo)) {
    errores.push('El campo "finalizo" solo admite los valores "si" o "no".');
  }

  registros.forEach((registro) => {
    if (!validarFormatoHoraControl(registro.hlpe)) {
      errores.push(`El campo "HLPE${registro.pe}" debe respetar el formato HH:MM.`);
    }

    if (!validarFormatoTaqueo(registro.tpe)) {
      errores.push(`El campo "TPE${registro.pe}" debe respetar el formato HH:MM:SS.ddd.`);
    }

    if (!validarFormatoTiempoPE(registro.pe_tiempo)) {
      errores.push(`El campo "PE${registro.pe}" debe respetar el formato mm:ss.ddd.`);
    }
  });

  return {
    esValido: errores.length === 0,
    errores,
    datosNormalizados: {
      nro,
      finalizo: finalizo.toLowerCase(),
      registros
    }
  };
}

export function validarLoteTiemposAdmin(items) {
  if (!Array.isArray(items)) {
    return {
      esValido: false,
      errores: ['El cuerpo debe contener un arreglo en la propiedad "items".'],
      itemsNormalizados: []
    };
  }

  const errores = [];
  const itemsNormalizados = items.map((item, index) => {
    const validacion = validarTiempoCompetidorAdmin(item);

    if (!validacion.esValido) {
      validacion.errores.forEach((error) => {
        errores.push(`Fila ${index + 1}: ${error}`);
      });
    }

    return validacion.datosNormalizados;
  });

  return {
    esValido: errores.length === 0,
    errores,
    itemsNormalizados
  };
}
