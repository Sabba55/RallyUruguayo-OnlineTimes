import dotenv from 'dotenv';
import readline from 'readline';

import { generarClasifEtapa1 } from './pdf/pdfClasifEtapa1.js';
import { generarClasifEtapa1General } from './pdf/pdfClasifEtapa1General.js';
import { generarClasifEtapa2 } from './pdf/pdfClasifEtapa2.js';
import { generarClasifEtapa2General } from './pdf/pdfClasifEtapa2General.js';
import { generarClasifFinalClases } from './pdf/pdfClasifFinalClases.js';
import { generarClasifFinalGeneral } from './pdf/pdfClasifFinalGeneral.js';
import { construirFechaEvento } from './pdf/pdfBase.js';
import { generarInscriptos } from './pdf/pdfInscriptos.js';
import { generarOrdenLargada } from './pdf/pdfOrdenLargada.js';
import { obtenerColeccionPublica } from '../servicios/infraestructura/datosPublicos.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function preguntar(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (answer) => resolve(answer.trim()));
  });
}

async function pedirMetadatos() {
  console.log('\n------------------------------------------');
  console.log('  Datos del encabezado (para todos los PDFs)');
  console.log('------------------------------------------');

  let numeroFecha = '';
  while (!numeroFecha || Number.isNaN(Number.parseInt(numeroFecha, 10))) {
    numeroFecha = await preguntar('  Que numero de fecha del campeonato es? (ej: 1, 2, 3...): ');
    if (Number.isNaN(Number.parseInt(numeroFecha, 10))) {
      console.log('  Ingresa un numero entero.');
    }
  }

  const diaInicio = await preguntar('  Dia de inicio del evento? (ej: 27 Febrero): ');
  const diaFin = await preguntar('  Dia de cierre del evento? (ej: 1 Marzo): ');

  return {
    numeroFecha: Number.parseInt(numeroFecha, 10),
    fechaEvento: construirFechaEvento(diaInicio, diaFin)
  };
}

async function mostrarMenu() {
  console.log('\n==========================================');
  console.log('   GENERADOR DE PDFs - RALLY ARGENTINO');
  console.log('==========================================');
  console.log('  INSCRIPTOS / ORDENES DE LARGADA');
  console.log('   1. Inscriptos');
  console.log('   2. Orden de Largada Etapa 1');
  console.log('   3. Orden de Largada Etapa 2');
  console.log('------------------------------------------');
  console.log('  CLASIFICACIONES FINALES');
  console.log('   4. Clasificacion Final General');
  console.log('   5. Clasificacion Final por Categoria');
  console.log('------------------------------------------');
  console.log('  CLASIFICACIONES DIA 1 / DIA 2');
  console.log('   6. Clasificacion por Categoria Etapa 1');
  console.log('   7. Clasificacion por Categoria Etapa 2');
  console.log('   8. Clasificacion General Etapa 1');
  console.log('   9. Clasificacion General Etapa 2');
  console.log('------------------------------------------');
  console.log('   0. Salir');

  return preguntar('\n  Seleccion: ');
}

async function obtenerDatosClasificacion() {
  return Promise.all([
    obtenerColeccionPublica('tiempos'),
    obtenerColeccionPublica('tramos'),
    obtenerColeccionPublica('penalizaciones'),
    obtenerColeccionPublica('inscriptos')
  ]);
}

async function main() {
  console.log('\nRally Argentino - Generador de PDFs\n');

  const opcion = await mostrarMenu();

  if (opcion === '0') {
    console.log('\nHasta luego.\n');
    rl.close();
    process.exit(0);
  }

  const opcionesValidas = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  if (!opcionesValidas.has(opcion)) {
    console.log('\nOpcion invalida. Vuelve a ejecutar el comando.\n');
    rl.close();
    process.exit(1);
  }

  const metadatos = await pedirMetadatos();
  rl.close();

  console.log('\nObteniendo datos del sistema actual...');

  try {
    switch (opcion) {
      case '1': {
        const inscriptos = await obtenerColeccionPublica('inscriptos');
        await generarInscriptos(metadatos, inscriptos);
        break;
      }

      case '2': {
        const horariosEtapa1 = await obtenerColeccionPublica('horariosE1');
        await generarOrdenLargada(1, metadatos, horariosEtapa1);
        break;
      }

      case '3': {
        const horariosEtapa2 = await obtenerColeccionPublica('horariosE2');
        await generarOrdenLargada(2, metadatos, horariosEtapa2);
        break;
      }

      case '4': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifFinalGeneral(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      case '5': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifFinalClases(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      case '6': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifEtapa1(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      case '7': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifEtapa2(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      case '8': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifEtapa1General(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      case '9': {
        const [tiempos, tramos, penalizaciones, inscriptos] = await obtenerDatosClasificacion();
        await generarClasifEtapa2General(metadatos, tiempos, tramos, penalizaciones, inscriptos);
        break;
      }

      default:
        break;
    }

    console.log('\nListo. Revisa tu carpeta Descargas.\n');
  } catch (error) {
    console.error('\nError al generar PDF:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
