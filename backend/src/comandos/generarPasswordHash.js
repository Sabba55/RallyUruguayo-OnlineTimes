import { generarHashPassword } from '../servicios/infraestructura/password.js';

const password = process.argv[2] || '';

if (!password) {
  console.error('Uso: node src/comandos/generarPasswordHash.js "TuPasswordTemporal"');
  process.exit(1);
}

try {
  const hash = await generarHashPassword(password);
  console.log(hash);
} catch (error) {
  console.error('No se pudo generar el hash:', error.message);
  process.exit(1);
}
