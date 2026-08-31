import React, { useEffect, useState } from 'react';
import { obtenerTiempos, obtenerTramos, obtenerPenalizaciones, obtenerInscriptos } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import { obtenerRutaLogoVehiculo } from '../../utilidades/logosVehiculos';
import '../../estilos/clasificaciones/ClasFinalGeneral.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function ClasFinalGeneral({ onVolver }) {
    const { refreshKey, segundosRestantes } = useGlobalRefresh();
    const [tiempos, setTiempos] = useState([]);
    const [tramos, setTramos] = useState([]);
    const [penalizaciones, setPenalizaciones] = useState([]);
    const [inscriptos, setInscriptos] = useState([]);
    const [cargandoInicial, setCargandoInicial] = useState(true);
    const [error, setError] = useState(null);
    const [pilotosClasificados, setPilotosClasificados] = useState([]);
    
    useEffect(() => {
        cargarDatos(true);
    }, []);

    useEffect(() => {
        if (refreshKey === 0) {
            return;
        }

        cargarDatos(false);
    }, [refreshKey]);

    const cargarDatos = async (esInicial = false) => {
        try {
            const posicionScroll = window.scrollY;
            
            if (esInicial) setCargandoInicial(true);

            const [datosTiempos, datosTramos, datosPenalizaciones, datosInscriptos] = await Promise.all([
                obtenerTiempos(),
                obtenerTramos(),
                obtenerPenalizaciones(),
                obtenerInscriptos()
            ]);

            setTiempos(datosTiempos);
            setTramos(datosTramos);
            setPenalizaciones(datosPenalizaciones);
            setInscriptos(datosInscriptos);
            
            const peMaximo = obtenerMaximoPE(datosTramos);
            const clasificados = generarClasificacion(
                datosTiempos,
                datosTramos,
                datosPenalizaciones,
                peMaximo,
                datosInscriptos
            );
            const clasificadosConPosClase = calcularPosicionesPorClase(clasificados);
            setPilotosClasificados(clasificadosConPosClase);
            
            if (esInicial) setCargandoInicial(false);

            setTimeout(() => {
                window.scrollTo(0, posicionScroll);
            }, 0);
            } catch (err) {
            console.error(err);
            setError('Error al cargar los datos de clasificación final');
            if (esInicial) setCargandoInicial(false);
        }
    };

    // Normalizar clase: "Copa RC2", "RC2 Copa", etc. se convierte en "RC2"
    const normalizarClase = (clase) => {
        if (!clase) return 'Sin clase';
        
        const claseNormalizada = clase.toLowerCase().trim();
        
        if (claseNormalizada.includes('rc2') && claseNormalizada.includes('copa')) {
        return 'RC2';
        }
        
        return clase;
    };

    // Verificar si un tramo está cancelado
    const estaTramoCancelado = (pe, tramosData = tramos) => {
        const tramo = tramosData.find(t => parseInt(t.pe) === parseInt(pe));
        if (!tramo || !tramo.estado) return false;
        
        const estadoNormalizado = tramo.estado.toLowerCase().trim();
        return estadoNormalizado === 'cancelado' || estadoNormalizado === 'cancelada';
    };

    // Obtener lista de PEs válidos (no cancelados)
    const obtenerPEsValidos = (peMaximo, tramosData = tramos) => {
        const pesValidos = [];
        for (let i = 1; i <= peMaximo; i++) {
        if (!estaTramoCancelado(i, tramosData)) {
            pesValidos.push(i);
        }
        }
        return pesValidos;
    };

    // Corregir formato de tiempo antes de procesarlo
    const corregirFormatoTiempo = (tiempoStr) => {
        if (!tiempoStr || tiempoStr === '' || tiempoStr === '-' || tiempoStr === null || tiempoStr === undefined) {
        return '';
        }
        
        let tiempo = String(tiempoStr).trim();
        
        const estadosEspeciales = ['DNF', 'RET', 'AB', 'DNS', 'DSQ', 'NC'];
        if (estadosEspeciales.includes(tiempo.toUpperCase())) {
        return '-';
        }
        
        const separadores = (tiempo.match(/[:.,]/g) || []).length;
        
        if (separadores === 2) {
        const partes = tiempo.split(/[:.,]/);
        if (partes.length === 3) {
            tiempo = `${partes[0]}:${partes[1]}.${partes[2]}`;
        }
        } else if (separadores === 1) {
        tiempo = tiempo.replace(',', '.');
        }
        
        return tiempo;
    };

    const convertirASegundos = (t) => {
        if (!t || t === '-' || t === '' || t === null || t === undefined) return 0;
        
        try {
        const tiempoCorregido = corregirFormatoTiempo(t);
        if (!tiempoCorregido || tiempoCorregido === '-') return 0;
        
        const [min, seg] = tiempoCorregido.split(':');
        const minutos = parseInt(min) || 0;
        const segundos = parseFloat(seg) || 0;
        
        if (minutos < 0 || segundos < 0) return 0;
        
        return minutos * 60 + segundos;
        } catch (error) {
        console.error('Error al convertir tiempo:', t, error);
        return 0;
        }
    };

    // Obtener el número máximo de PE en tramos
    const obtenerMaximoPE = (tramosData = tramos) => {
        if (tramosData.length === 0) return 0;
        return Math.max(...tramosData.map(t => parseInt(t.pe) || 0));
    };

    // Obtener penalizaciones de un piloto
    const obtenerPenalizacionesPiloto = (nroPiloto, peMaximo, penalizacionesData = penalizaciones) => {
        return penalizacionesData.filter(pen => {
        const nroMatch = String(pen.nro).trim() === String(nroPiloto).trim();
        const peOcurrido = parseInt(pen.peocurrido) || 0;
        return nroMatch && peOcurrido <= peMaximo;
        });
    };

    // Calcular tiempo total de penalizaciones en segundos
    const calcularTotalPenalizaciones = (nroPiloto, peMaximo, penalizacionesData = penalizaciones) => {
        const penalizacionesPiloto = obtenerPenalizacionesPiloto(nroPiloto, peMaximo, penalizacionesData);
        let totalSegundos = 0;
        
        penalizacionesPiloto.forEach(pen => {
        totalSegundos += convertirASegundos(pen.tiempo);
        });
        
        return totalSegundos;
    };

    // Convierte segundos a mm:ss.d o hh:mm:ss.d si supera 60 min
    const segundosATiempo = (s) => {
        const totalSegundos = Math.floor(Math.round(s * 1000) / 1000 * 10) / 10;
        const seg = Math.floor(totalSegundos % 60);
        // Redondear también acá antes de aplicar floor
        const decima = Math.floor(Math.round((totalSegundos % 1) * 100) / 100 * 10);
        const minTotal = Math.floor(totalSegundos / 60);

        if (minTotal >= 60) {
        const horas = Math.floor(minTotal / 60);
        const min = minTotal % 60;
        return `${horas}:${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}.${decima}`;
        } else {
        return `${minTotal}:${String(seg).padStart(2, '0')}.${decima}`;
        }
    };

    // Calcula diferencia
    const calcularDiferencia = (a, b) => {
        const diff = a - b;
        if (diff <= 0) return '–';
        return segundosATiempo(diff).replace(/^/, '+');
    };

    const primeraPalabra = (texto) => texto ? texto.split(' ')[0] : '-';

    // Verifica si un piloto completó TODOS los PEs VÁLIDOS (excluyendo cancelados)
    const pilotoCompletoTodosLosPEs = (piloto, peMaximo, tramosData = tramos) => {
        const pesValidos = obtenerPEsValidos(peMaximo, tramosData);
        
        for (let pe of pesValidos) {
        const key = `pe${pe}`;
        const tiempo = piloto[key];
        if (!tiempo || tiempo === '-' || tiempo === '' || tiempo === null || tiempo === undefined) {
            return false;
        }
        }
        return true;
    };

    // Calcular tiempo neto (sin penalizaciones) - SOLO de PEs válidos
    const calcularTiempoNetoTotal = (piloto, peMaximo, tramosData = tramos) => {
        const pesValidos = obtenerPEsValidos(peMaximo, tramosData);
        let total = 0;
        
        for (let pe of pesValidos) {
            const key = `pe${pe}`;
            if (piloto[key] && piloto[key] !== '-' && piloto[key] !== '' && piloto[key] !== null) {
                total += convertirASegundos(piloto[key]);
            }
        }
        return total;
    };

    // Calcular tiempo total (con penalizaciones)
    const calcularTotalConPenalizaciones = (piloto, peMaximo, tramosData = tramos, penalizacionesData = penalizaciones) => {
        const tiempoNeto = calcularTiempoNetoTotal(piloto, peMaximo, tramosData);
        const penalizacionesTotal = calcularTotalPenalizaciones(piloto.nro, peMaximo, penalizacionesData);
        return tiempoNeto + penalizacionesTotal;
    };

    // Obtener distancia de un PE específico
    const obtenerDistanciaPE = (numeroPE, tramosData = tramos) => {
        const tramo = tramosData.find(t => t.pe === String(numeroPE) || t.pe === numeroPE);
        if (tramo && tramo.kms) {
            return parseFloat(tramo.kms) || 0;
        }
        return 0;
    };

    // Calcular distancia total de PEs válidos
    const obtenerDistanciaTotal = (peMaximo, tramosData = tramos) => {
        const pesValidos = obtenerPEsValidos(peMaximo, tramosData);
        let totalDistancia = 0;
        
        for (let pe of pesValidos) {
            totalDistancia += obtenerDistanciaPE(pe, tramosData);
        }
        return totalDistancia;
    };

    // Calcular velocidad promedio en km/h para el total
    const calcularVelocidadPromedioGeneral = (totalSegundos, peMaximo, tramosData = tramos) => {
        if (totalSegundos === 0) return '-';
        
        const distancia = obtenerDistanciaTotal(peMaximo, tramosData);
        if (distancia === 0) return '-';
        
        const horas = totalSegundos / 3600;
        const velocidad = distancia / horas;
        
        return velocidad.toFixed(1);
    };

    // Calcular y asignar la posición por clase
    const calcularPosicionesPorClase = (pilotosClasificadosArr) => {
        // Agrupar por clase normalizada
        const clasificacionesPorClase = pilotosClasificadosArr.reduce((acc, piloto) => {
        const clase = normalizarClase(piloto.clase);
        if (!acc[clase]) {
            acc[clase] = [];
        }
        acc[clase].push(piloto);
        return acc;
        }, {});
        
        const pilotosConPosicionClase = [];

        // Asignar posición dentro de cada clase
        for (const clase in clasificacionesPorClase) {
        // Los pilotos ya están ordenados por tiempo general, lo cual es correcto.
        // Aquí solo necesitamos iterar y asignar la posición (i + 1).
        clasificacionesPorClase[clase].forEach((piloto, i) => {
            pilotosConPosicionClase.push({
            ...piloto,
            posicionClase: i + 1
            });
        });
        }
        
        // Devolver la lista general, manteniendo el orden original (por tiempo total general)
        return pilotosClasificadosArr.map(p => {
            const pilotoEncontrado = pilotosConPosicionClase.find(pc => pc.nro === p.nro);
            return {
                ...p,
                posicionClase: pilotoEncontrado ? pilotoEncontrado.posicionClase : '-'
            };
        });
    };

    // Función auxiliar para generar la clasificación (utilizada en cargarDatos)
    const generarClasificacion = (tiemposData, tramosData, penalizacionesData, peMaximo, inscriptosData) => {  // ← AGREGADO inscriptosData
        // Filtrar solo pilotos que completaron todos los PEs VÁLIDOS y que hayan finalizado
        const clasificados = tiemposData
            .filter((p) => {
                // Verificar que completó todos los PEs válidos
                if (!pilotoCompletoTodosLosPEs(p, peMaximo, tramosData)) return false;
                
                // Verificar campo "finalizo" o "fin" (case insensitive)
                const finalizo = p.finalizo || p.fin || '';
                const finalizoNormalizado = String(finalizo).toLowerCase().trim();
                
                // Solo incluir si finalizo es "si"
                return finalizoNormalizado === 'si';
            })
            .map((p) => {
                // Buscar los datos del piloto en inscriptos
                const datosInscripto = inscriptosData.find(i => String(i.nro) === String(p.nro));
                
                return {
                    ...p,
                    // Agregar o sobrescribir con datos de inscriptos
                    nac: datosInscripto?.nac || p.nac || 'ARG ARG',  
                    piloto: datosInscripto?.piloto || p.piloto,
                    navegante: datosInscripto?.navegante || p.navegante,
                    vehiculo: datosInscripto?.vehiculo || p.vehiculo,
                    clase: datosInscripto?.clase || p.clase,
                    totalSegundos: calcularTotalConPenalizaciones(p, peMaximo, tramosData, penalizacionesData),
                    tiempoNetoSegundos: calcularTiempoNetoTotal(p, peMaximo, tramosData),
                    penalizacionesSegundos: calcularTotalPenalizaciones(p.nro, peMaximo, penalizacionesData)
                };
            });

        clasificados.sort((a, b) => a.totalSegundos - b.totalSegundos);
        
        return clasificados;
    };

    if (cargandoInicial) {
        return (
        <div className="text-center py-5">
            <div className="spinner-border" role="status" style={{ color: '#18283c' }}></div>
            <p className="mt-3">Cargando clasificación final...</p>
        </div>
        );
    }

    if (error) {
        return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
    }

    const peMaximo = obtenerMaximoPE();
    const mejorTiempo = pilotosClasificados.length ? pilotosClasificados[0].totalSegundos : 0;
    const distanciaTotal = obtenerDistanciaTotal(peMaximo);

    return (
        <div className="contenedor-clas-final-general">

        {/* TABLA DE CLASIFICACIÓN FINAL */}
        <div className="tabla-clas-final-wrapper pb-3 py-3">
            <table className="table table-bordered table-striped tabla-clas-final mb-0">
            <thead>
                <tr className="tabla-encabezado-clas-final text-center">
                <th>POS</th>
                <th>Nº</th>
                <th>NAC</th>
                <th>PILOTO / NAVEGANTE</th>
                <th>CLASE</th>
                <th style={{ fontSize: '0.85rem', lineHeight: '1.3', width: '50px' }}>POS. CLA</th>
                <th>VEHICULO</th>
                <th>TIEMPO</th>
                <th>PENAL.</th>
                <th>T.TOTAL</th>
                <th style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                    <div className="fw-bold">DIF. 1º</div>
                    <div className="fw-semibold">DIF. ANT</div>
                </th>
                <th>PROM</th>
                </tr>
            </thead>

            <tbody>
                {pilotosClasificados.length === 0 ? (
                <tr>
                    <td colSpan="12" className="text-center text-muted py-3">
                    No hay pilotos que hayan completado todos los tramos válidos
                    </td>
                </tr>
                ) : (
                pilotosClasificados.map((p, i) => {
                    const anterior = i > 0 ? pilotosClasificados[i - 1].totalSegundos : p.totalSegundos;
                    // Usamos los valores precalculados en la generación de la clasificación
                    const penalizacionesTotal = p.penalizacionesSegundos;
                    const tiempoNeto = p.tiempoNetoSegundos;
                    const tienePenalizaciones = penalizacionesTotal > 0;
                    
                    return (
                    <tr key={p.nro} className="tabla-fila-datos-clas-final">
                        <td className="text-center">
                            <span className="badge-pos-clas-final">{i + 1}</span>
                        </td>
                        <td className="text-center fw-bold">{p.nro}</td>
                        <td className="text-center celda-nacionalidad-clas-final">
                            {(() => {
                                const nacionalidades = p.nac ? p.nac.trim().split(/\s+/) : ['ARG'];
                                
                                // Si solo hay una nacionalidad, aplicarla para ambos
                                const nacPiloto = nacionalidades[0] || 'ARG';
                                const nacNavegante = nacionalidades[1] || nacPiloto;
                                
                                const rutaBanderaPiloto = `/assets/flags/${nacPiloto.toLowerCase()}.png`;
                                const rutaBanderaNavegante = `/assets/flags/${nacNavegante.toLowerCase()}.png`;

                                return (
                                <div className="contenedor-banderas-apiladas">
                                    <img
                                    src={rutaBanderaPiloto}
                                    alt={nacPiloto}
                                    className="bandera-nacionalidad-clas"
                                    title={`Piloto: ${nacPiloto}`}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.replaceWith(document.createTextNode(nacPiloto));
                                    }}
                                    />
                                    <img
                                    src={rutaBanderaNavegante}
                                    alt={nacNavegante}
                                    className="bandera-nacionalidad-clas"
                                    title={`Navegante: ${nacNavegante}`}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.replaceWith(document.createTextNode(nacNavegante));
                                    }}
                                    />
                                </div>
                                );
                            })()}
                        </td>
                        <td className="text-center celda-piloto-clas-final">
                            <div className="nombre-piloto-clas-final">{p.piloto}</div>
                            <div className="nombre-navegante-clas-final">{p.navegante}</div>
                        </td>
                        <td className="text-center fw-medium">{normalizarClase(p.clase)}</td>
                        <td className="text-center fw-bold">
                            <span className={`badge-pos-clas ${p.posicionClase === 1 ? 'pos-1' : p.posicionClase === 2 ? 'pos-2' : p.posicionClase === 3 ? 'pos-3' : ''}`}>
                                {p.posicionClase}
                            </span>
                        </td>
                        <td className="text-center celda-vehiculo-clas-final">
                            {(() => {
                                const marca = primeraPalabra(p.vehiculo);
                                const rutaLogo = obtenerRutaLogoVehiculo(p.vehiculo);

                                return (
                                <>
                                    <img
                                    src={rutaLogo}
                                    alt={marca}
                                    className="logo-marca-clas-final"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                    />
                                    <span className="texto-vehiculo-clas-final">{p.vehiculo}</span>
                                </>
                                );
                            })()}
                        </td>
                        <td className="text-center fw-bold">{segundosATiempo(tiempoNeto)}</td>
                        <td className="text-center">
                            {tienePenalizaciones ? (
                                <span className="text-danger fw-bold">
                                {segundosATiempo(penalizacionesTotal)}
                                </span>
                            ) : (
                                <span className="text-muted">-</span>
                            )}
                        </td>
                        <td className="text-center fw-bold">{segundosATiempo(p.totalSegundos)}</td>
                        <td className="text-center" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                            <div className="fw-semibold">{calcularDiferencia(p.totalSegundos, mejorTiempo)}</div>
                            <div className="text-muted">{calcularDiferencia(p.totalSegundos, anterior)}</div>
                        </td>
                        <td className="text-center fw-bold">
                            {calcularVelocidadPromedioGeneral(p.totalSegundos, peMaximo)}
                        </td>
                    </tr>
                    );
                })
                )}
            </tbody>
            </table>
        </div>

        {/* CABECERA */}
        <div className="d-flex justify-content-center align-items-center mb-1 flex-column">      
            {/* CONTADOR DE ACTUALIZACIÓN */}
            <div className="mt-3 d-flex align-items-center gap-2 mb-4">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Próxima actualización en:
                </span>
                <span 
                    className="badge bg-primary d-flex align-items-center gap-1" 
                    style={{ fontSize: '0.95rem', padding: '0.4rem 0.8rem' }}
                >
                    <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    fill="currentColor" 
                    viewBox="0 0 16 16"
                    >
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                    </svg>
                    {segundosRestantes}s
                </span>
            </div>
        </div>
        </div>
    );
}

export default ClasFinalGeneral;
