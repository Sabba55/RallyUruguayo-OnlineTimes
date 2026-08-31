import { obtenerColorBadgeNro } from '../../utilidades/nroBadge.js';

export function BadgeNro({ nro, clase, className = '', title }) {
  return (
    <span
      className={`badge-nro ${className}`.trim()}
      style={{ backgroundColor: obtenerColorBadgeNro(clase) }}
      title={title || (clase ? `Clase ${clase}` : 'Numero de auto')}
    >
      {nro}
    </span>
  );
}
