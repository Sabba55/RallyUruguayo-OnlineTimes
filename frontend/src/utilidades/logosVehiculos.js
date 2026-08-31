function obtenerRutaLogoVehiculo(vehiculo) {
  if (!vehiculo) {
    return '';
  }

  const vehiculoNormalizado = String(vehiculo).toLowerCase();
  const marca = String(vehiculo).split(' ')[0].toLowerCase();

  if (marca === 'skoda' && vehiculoNormalizado.includes('rs')) {
    return '/assets/icon/skodars.png';
  }

  if (marca === 'peugeot' && vehiculoNormalizado.includes('g1')) {
    return '/assets/icon/peugeotg1.png';
  }

  return `/assets/icon/${marca}.png`;
}

export { obtenerRutaLogoVehiculo };
