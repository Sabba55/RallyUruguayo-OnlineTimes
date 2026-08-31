const VARIABLES_REQUERIDAS = [
  'POSTGRES_HOST',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'ADMIN_AUTH_SECRET'
];

export function validarVariablesDeEntorno() {
  const faltantes = VARIABLES_REQUERIDAS.filter((variable) => !process.env[variable]);

  if (faltantes.length > 0) {
    console.error('\nFALTAN VARIABLES DE ENTORNO REQUERIDAS:');
    faltantes.forEach((variable) => console.error(`   - ${variable}`));
    console.error('\nRevisa el archivo .env y agrega las variables faltantes.\n');
    process.exit(1);
  }

  console.log('Variables de entorno validadas correctamente');
}
