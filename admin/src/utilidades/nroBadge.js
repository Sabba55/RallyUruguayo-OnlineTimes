const COLORES_POR_CLASE = {
  'RC2': '#d9d9d9',
  'COPA RC2': '#a5a6a7',
  'RCMR': '#ffbbbb',
  'RC4': '#ffd966',
  'RC3': '#ead1dc',
  'RC5': '#b7e1cd'
};

export function obtenerColorBadgeNro(clase) {
  const clave = String(clase || '').trim().toUpperCase();
  return COLORES_POR_CLASE[clave] || '#d0d7de';
}

