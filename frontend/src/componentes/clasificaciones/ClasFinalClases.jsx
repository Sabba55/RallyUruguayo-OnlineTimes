import React, { useEffect, useState } from 'react';
import { obtenerTiempos, obtenerTramos, obtenerPenalizaciones, obtenerInscriptos } from '../../servicios/apiService';
import { useGlobalRefresh } from '../../context/GlobalRefreshContext';
import { obtenerRutaLogoVehiculo } from '../../utilidades/logosVehiculos';
import '../../estilos/clasificaciones/ClasFinalClases.css';
import ErrorDisplay from '../errores/ErrorDisplay';

function ClasFinalClases({ onVolver }) {
    const { refreshKey, segundosRestantes } = useGlobalRefresh();
    const [tiempos, setTiempos] = useState([]);
    const [tramos, setTramos] = useState([]);
    const [penalizaciones, setPenalizaciones] = useState([]);
    const [cargandoInicial, setCargandoInicial] = useState(true);
    const [error, setError] = useState(null);
    const [pilotosPorClase, setPilotosPorClase] = useState({});
    const [inscriptos, setInscriptos] = useState([]);

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
        const clasificadosPorClase = generarClasificacionPorClases(
            datosTiempos,
            datosTramos,
            datosPenalizaciones,
            peMaximo,
            datosInscriptos
        );
        setPilotosPorClase(clasificadosPorClase);
        
        if (esInicial) setCargandoInicial(false);

        setTimeout(() => {
            window.scrollTo(0, posicionScroll);
        }, 0);
        } catch (err) {
        console.error(err);
        setError('Error al cargar los datos de clasificación final por clases');
        if (esInicial) setCargandoInicial(false);
        }
    };

    const normalizarClase = (clase) => {
        if (!clase) return 'Sin clase';        
            return clase;
    };

    const estaTramoCancelado = (pe, tramosData = tramos) => {
        const tramo = tramosData.find(t => parseInt(t.pe) === parseInt(pe));
        if (!tramo || !tramo.estado) return false;
        
        const estadoNormalizado = tramo.estado.toLowerCase().trim();
        return estadoNormalizado === 'cancelado' || estadoNormalizado === 'cancelada';
    };

    const obtenerPEsValidos = (peMaximo, tramosData = tramos) => {
        const pesValidos = [];
        for (let i = 1; i <= peMaximo; i++) {
            if (!estaTramoCancelado(i, tramosData)) {
                pesValidos.push(i);
            }
        }
        return pesValidos;
    };

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

    const obtenerMaximoPE = (tramosData = tramos) => {
        if (tramosData.length === 0) return 0;
        return Math.max(...tramosData.map(t => parseInt(t.pe) || 0));
    };

    const obtenerPenalizacionesPiloto = (nroPiloto, peMaximo, penalizacionesData = penalizaciones) => {
        return penalizacionesData.filter(pen => {
            const nroMatch = String(pen.nro).trim() === String(nroPiloto).trim();
            const peOcurrido = parseInt(pen.peocurrido) || 0;
            return nroMatch && peOcurrido <= peMaximo;
        });
    };

    const calcularTotalPenalizaciones = (nroPiloto, peMaximo, penalizacionesData = penalizaciones) => {
        const penalizacionesPiloto = obtenerPenalizacionesPiloto(nroPiloto, peMaximo, penalizacionesData);
        let totalSegundos = 0;
        
        penalizacionesPiloto.forEach(pen => {
            totalSegundos += convertirASegundos(pen.tiempo);
        });
        
        return totalSegundos;
    };

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

    const calcularDiferencia = (a, b) => {
        const diff = a - b;
        if (diff <= 0) return '—';
        return segundosATiempo(diff).replace(/^/, '+');
    };

    const primeraPalabra = (texto) => texto ? texto.split(' ')[0] : '-';

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

    const calcularTotalConPenalizaciones = (piloto, peMaximo, tramosData = tramos, penalizacionesData = penalizaciones) => {
        const tiempoNeto = calcularTiempoNetoTotal(piloto, peMaximo, tramosData);
        const penalizacionesTotal = calcularTotalPenalizaciones(piloto.nro, peMaximo, penalizacionesData);
        return tiempoNeto + penalizacionesTotal;
    };

    const obtenerDistanciaPE = (numeroPE, tramosData = tramos) => {
        const tramo = tramosData.find(t => t.pe === String(numeroPE) || t.pe === numeroPE);
        if (tramo && tramo.kms) {
            return parseFloat(tramo.kms) || 0;
        }
        return 0;
    };

    const obtenerDistanciaTotal = (peMaximo, tramosData = tramos) => {
        const pesValidos = obtenerPEsValidos(peMaximo, tramosData);
        let totalDistancia = 0;
        
        for (let pe of pesValidos) {
            totalDistancia += obtenerDistanciaPE(pe, tramosData);
        }
        return totalDistancia;
    };

    const calcularVelocidadPromedioGeneral = (totalSegundos, peMaximo, tramosData = tramos) => {
        if (totalSegundos === 0) return '-';
        
        const distancia = obtenerDistanciaTotal(peMaximo, tramosData);
        if (distancia === 0) return '-';
        
        const horas = totalSegundos / 3600;
        const velocidad = distancia / horas;
        
        return velocidad.toFixed(1);
    };

    const generarClasificacionPorClases = (tiemposData, tramosData, penalizacionesData, peMaximo, inscriptosData) => {
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
                    nac: datosInscripto?.nac || p.nac || 'ARG ARG',
                    piloto: datosInscripto?.piloto || p.piloto,
                    navegante: datosInscripto?.navegante || p.navegante,
                    vehiculo: datosInscripto?.vehiculo || p.vehiculo,
                    clase: datosInscripto?.clase || p.clase,
                    totalSegundos: calcularTotalConPenalizaciones(p, peMaximo, tramosData, penalizacionesData),
                    tiempoNetoSegundos: calcularTiempoNetoTotal(p, peMaximo, tramosData),
                    penalizacionesSegundos: calcularTotalPenalizaciones(p.nro, peMaximo, penalizacionesData),
                    claseOriginal: datosInscripto?.clase || p.clase
                };
            });

        // Agrupar por clase con lógica especial para RC2 y Copa RC2
        const porClase = {};

        clasificados.forEach(piloto => {
        const claseOriginal = piloto.claseOriginal || 'Sin clase';
        const claseNormalizada = claseOriginal.toLowerCase().trim();
        
        // Verificar si es Copa RC2
        const esCopaRC2 = claseNormalizada.includes('rc2') && claseNormalizada.includes('copa');
        
        // Verificar si es RC2 "puro" (sin sufijos como N, S, etc.)
        const esRC2Puro = /\brc2\b(?!\w)/i.test(claseNormalizada);
        
        // Si es Copa RC2, va a ambos grupos
        if (esCopaRC2) {
            if (!porClase['Copa RC2']) porClase['Copa RC2'] = [];
            porClase['Copa RC2'].push(piloto);
            
            if (!porClase['RC2']) porClase['RC2'] = [];
            porClase['RC2'].push(piloto);
        }
        // Si es RC2 puro (sin sufijos), solo va a RC2
        else if (esRC2Puro) {
            if (!porClase['RC2']) porClase['RC2'] = [];
            porClase['RC2'].push(piloto);
        }
        // Para cualquier otra clase, verificar si tiene múltiples categorías separadas por espacios
        else {
            // Dividir por espacios para detectar categorías múltiples
            const categorias = claseOriginal.split(/\s+/).filter(c => c.trim() !== '');
            
            // Si hay más de una categoría, agregar a cada una
            if (categorias.length > 1) {
            categorias.forEach(cat => {
                const catTrimmed = cat.trim();
                if (!porClase[catTrimmed]) porClase[catTrimmed] = [];
                porClase[catTrimmed].push(piloto);
            });
            } else {
            // Si es una sola categoría, agregar normalmente
            if (!porClase[claseOriginal]) porClase[claseOriginal] = [];
            porClase[claseOriginal].push(piloto);
            }
        }
        });

        // Ordenar pilotos dentro de cada clase
        Object.keys(porClase).forEach(clase => {
            porClase[clase].sort((a, b) => a.totalSegundos - b.totalSegundos);
        });

        return porClase;
    };

    const ordenarCategorias = (categorias) => {
        const ordenPrioridad = ['RC2', 'Copa RC2', 'RCMR', 'CT', 'RC4', 'RC3', 'RC5'];
        
        return categorias.sort((a, b) => {
            const indexA = ordenPrioridad.indexOf(a);
            const indexB = ordenPrioridad.indexOf(b);
            
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
            
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            
            return a.localeCompare(b);
        });
    };

    const obtenerNombreCategoria = (clase) => {
        if (clase === 'CT') return 'COPA TOYOTA';
        return clase;
    };

    const obtenerNombreSimplificado = (clase) => {
    // Si contiene guión, mostrar solo lo que está después del guión
    if (clase.includes('-')) {
        return clase.split('-').pop().trim();
    }
    // Si no tiene guión, devolver el nombre completo
    return clase;
    };

    if (cargandoInicial) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Cargando clasificación final por clases...</p>
            </div>
        );
    }

    if (error) {
        return <ErrorDisplay mensaje={error} onReintentar={cargarDatos} />;
    }

    const peMaximo = obtenerMaximoPE();

    return (
        <div className="contenedor-clas-final-clases">
            {/* CABECERA CON ÍNDICES */}
            <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
            <h2 className="titulo-pe text-center mb-2">Índices de Categorías</h2>
            
            {/* BOTONES DE ÍNDICE - CAMPEONATO ARGENTINO */}
            {(() => {
                const categoriasOficiales = ordenarCategorias(Object.keys(pilotosPorClase))
                .filter((clase) => !clase.includes('-'));

                if (categoriasOficiales.length === 0) return null;

                return (
                <div className="contenedor-indice-principal mb-2">
                    <div className="logo-campeonato">
                    <img 
                        src="/assets/logo-rally-argentino.png" 
                        alt="Rally Argentino"
                        className="img-logo-campeonato"
                    />
                    </div>
                    <div className="linea-divisoria"></div>
                    <div className="botones-campeonato">
                    {categoriasOficiales.map((clase) => (
                        <button
                        key={clase}
                        className="btn-categoria"
                        onClick={() => {
                            const elemento = document.getElementById(`categoria-${clase}`);
                            if (elemento) {
                            elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        >
                        {clase}
                        </button>
                    ))}
                    </div>
                </div>
                );
            })()}

            {/* BOTONES DE ÍNDICE - CAMPEONATOS SECUNDARIOS */}
            {(() => {
                const categoriasSecundarias = ordenarCategorias(Object.keys(pilotosPorClase))
                .filter((clase) => clase.includes('-'));

                if (categoriasSecundarias.length === 0) return null;

                return (
                <div className="contenedor-indice-secundario">
                    <div className="logo-campeonato">
                    <img 
                        src="/assets/icon-rally/rally-mys.png" 
                        alt="Rally Mar y Sierras"
                        className="img-logo-campeonato"
                    />
                    </div>
                    <div className="linea-divisoria"></div>
                    <div className="botones-campeonato">
                    {categoriasSecundarias.map((clase) => (
                        <button
                        key={clase}
                        className="btn-categoria-secundario"
                        onClick={() => {
                            const elemento = document.getElementById(`categoria-${clase}`);
                            if (elemento) {
                            elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }}
                        >
                        {obtenerNombreSimplificado(clase)}
                        </button>
                    ))}
                    </div>
                </div>
                );
            })()}
            
            {/* CONTADOR DE ACTUALIZACIÓN */}
            <div className="mt-3 d-flex align-items-center gap-2">
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

            {/* MENSAJE SI NO HAY DATOS */}
            {ordenarCategorias(Object.keys(pilotosPorClase || {}))
                .filter((clase) => {
                    const pilotos = pilotosPorClase[clase];
                    // En la final, verificamos si hay algún piloto con tiempo total calculado
                    return pilotos && pilotos.some((p) => p.totalSegundos > 0);
                }).length === 0 ? (
                <div className="alert alert-info text-center mt-4 mb-4">
                    No hay vehículos arribados que hayan completado todos los tramos.
                </div>
            ) : (
                <>

            {/* CLASIFICACIONES POR CLASE */}
            {ordenarCategorias(Object.keys(pilotosPorClase)).map((clase) => {
                const pilotos = pilotosPorClase[clase];
                const mejorTiempo = pilotos.length ? pilotos[0].totalSegundos : 0;

                return (
                    <div key={clase} className="mb-5" id={`categoria-${clase}`}>
                        <h3 className="text-center encabezado-clase">{obtenerNombreCategoria(clase)}</h3>
                        
                        <div className="tabla-clase-wrapper">
                            <table className="table table-bordered tabla-clase mb-0">
                                <thead>
                                    <tr className="tabla-encabezado-clase text-center">
                                        <th>POS</th>
                                        <th>Nº</th>
                                        <th>NAC</th>
                                        <th>PILOTO / NAVEGANTE</th>
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
                                    {pilotos.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className="text-center text-muted py-3">
                                                No hay pilotos que hayan completado todos los tramos válidos
                                            </td>
                                        </tr>
                                    ) : (
                                        pilotos.map((p, i) => {
                                            const anterior = i > 0 ? pilotos[i - 1].totalSegundos : p.totalSegundos;
                                            const penalizacionesTotal = p.penalizacionesSegundos;
                                            const tiempoNeto = p.tiempoNetoSegundos;
                                            const tienePenalizaciones = penalizacionesTotal > 0;
                                            
                                            return (
                                                <tr key={p.nro} className="tabla-fila-datos-clase">
                                                    <td className="text-center">
                                                        <span className="badge-pos-clase">{i + 1}</span>
                                                    </td>
                                                    <td className="text-center fw-bold">{p.nro}</td>
                                                    <td className="text-center celda-nacionalidad-clase">
                                                        {(() => {
                                                            const nacionalidades = p.nac ? p.nac.trim().split(/\s+/) : ['ARG'];
                                                            
                                                            const nacPiloto = nacionalidades[0] || 'ARG';
                                                            const nacNavegante = nacionalidades[1] || nacPiloto;
                                                            
                                                            const rutaBanderaPiloto = `/assets/flags/${nacPiloto.toLowerCase()}.png`;
                                                            const rutaBanderaNavegante = `/assets/flags/${nacNavegante.toLowerCase()}.png`;

                                                            return (
                                                                <div className="contenedor-banderas-apiladas">
                                                                    <img
                                                                        src={rutaBanderaPiloto}
                                                                        alt={nacPiloto}
                                                                        className="bandera-nacionalidad-clase"
                                                                        title={`Piloto: ${nacPiloto}`}
                                                                        onError={(e) => {
                                                                            e.target.onerror = null;
                                                                            e.target.replaceWith(document.createTextNode(nacPiloto));
                                                                        }}
                                                                    />
                                                                    <img
                                                                        src={rutaBanderaNavegante}
                                                                        alt={nacNavegante}
                                                                        className="bandera-nacionalidad-clase"
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
                                                    <td className="text-center celda-piloto-clase">
                                                        <div className="nombre-piloto-clase">{p.piloto}</div>
                                                        <div className="nombre-navegante-clase">{p.navegante}</div>
                                                    </td>
                                                    <td className="text-center celda-vehiculo-clase">
                                                        {(() => {
                                                            const marca = primeraPalabra(p.vehiculo);
                                                            const rutaLogo = obtenerRutaLogoVehiculo(p.vehiculo);

                                                            return (
                                                                <>
                                                                    <img
                                                                        src={rutaLogo}
                                                                        alt={marca}
                                                                        className="logo-marca-clase"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                        }}
                                                                    />
                                                                    <span className="texto-vehiculo-clase">{p.vehiculo}</span>
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
                    </div>
                );
            })}
            </>
            )}
        </div>
    );
}

export default ClasFinalClases;
