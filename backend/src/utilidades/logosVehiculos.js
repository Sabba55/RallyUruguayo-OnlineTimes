function obtenerRutaMarca(vehiculo) {
  if (!vehiculo) {
    return { marca: '-', logo: '' };
  }

  const vehiculoNormalizado = String(vehiculo).toLowerCase();
  const marca = String(vehiculo).split(' ')[0].toLowerCase();

  if (marca === 'skoda' && vehiculoNormalizado.includes('rs')) {
    return { marca, logo: '/assets/icon/skodars.png' };
  }

  if (marca === 'peugeot' && vehiculoNormalizado.includes('g1')) {
    return { marca, logo: '/assets/icon/peugeotg1.png' };
  }

  return { marca, logo: `/assets/icon/${marca}.png` };
}

export { obtenerRutaMarca };
