// src/components/map/views/patio/patioDataProcessor.ts
import type { PatioData } from '../../../../types';
import type { BloqueDataExtended } from '../../../../types/patioView.types';
import { getOptimizationModelDataForBlock } from './patioDataHelpers';

interface ProcessPatioDataParams {
    isCamilaActive: boolean;
    isOptimizationActive: boolean;
    activeModelName: string;
    optimizationMetrics: any;
    camilaData: any;
    realPatioData: any;
    timeState: any;
    patioId: string;
    currentTurno: number;
    currentPeriod: number;
}

const createCompleteStats = (partial?: Partial<BloqueDataExtended['stats']>): BloqueDataExtended['stats'] => {
    const baseStats = {
        teusActuales: 0,
        bahiasTotales: 35,
        bahiasReefer: 0,
        gate: { entradas: 0, salidas: 0 },
        gateEntradas: 0,
        gateSalidas: 0,
        muelle: { entradas: 0, salidas: 0 },
        muelleEntradas: 0,
        muelleSalidas: 0,
        despejes: 0,
        despejosBloques: 0,
        despejosPatios: 0,
        reubicacionesEntreBloques: 0,
        reubicacionesEntrePatios: 0,
        entradas: 0,
        salidas: 0,
        remanejos: 0,
        bahias: 35
    };

    return { ...baseStats, ...partial };
};

export const processPatioData = ({
    isCamilaActive,
    isOptimizationActive,
    activeModelName = 'Optimización',
    optimizationMetrics,
    camilaData,
    realPatioData,
    timeState,
    patioId,
    currentTurno,
    currentPeriod,
    referenceMetrics,
    comparisonType
}: ProcessPatioDataParams): PatioData | null => {
    try {
        if (isOptimizationActive && optimizationMetrics) {
            
            console.log(`🏗️ Procesando datos de optimización (${activeModelName}) para el patio`, {
                turno: currentTurno,
                vistaActual: currentTurno === 0 ? 'semana' : 'turno',
                ocupacionPromedio: optimizationMetrics.ocupacion?.promedio,
                bloquesConDatos: optimizationMetrics.ocupacion?.porBloque?.length
            });

            const bloquesIds = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];

            const bloquesOptimizados: BloqueDataExtended[] = bloquesIds.map(bloqueId => {
                const blockData = getOptimizationModelDataForBlock(
                    bloqueId, 
                    optimizationMetrics, 
                    currentTurno,
                    referenceMetrics,
                    comparisonType
                );

                if (!blockData) {
                    return {
                        id: bloqueId,
                        patioId: patioId,
                        name: `Bloque ${bloqueId}`,
                        ocupacion: 0,
                        ocupacionPromedio: 0,
                        capacidadTotal: 350,
                        bahias: [],
                        tipo: 'contenedores' as const,
                        bounds: { x: 0, y: 0, width: 100, height: 100 },
                        operationalStatus: 'restricted' as const,
                        equipmentType: 'rtg' as const,
                        ocupacionPorTurno: [],
                        stats: createCompleteStats()
                    };
                }

                const ocupacionMostrar = currentTurno === 0 ?
                    blockData.ocupacionPromedio :
                    blockData.ocupacionTurno;

                const estaActivo = ocupacionMostrar > 0;

                return {
                    id: bloqueId,
                    patioId: patioId,
                    name: `Bloque ${bloqueId}`,
                    ocupacion: Math.round(ocupacionMostrar),
                    ocupacionPromedio: Math.round(blockData.ocupacionPromedio),
                    capacidadTotal: blockData.capacidad,
                    bahias: [],
                    tipo: 'contenedores' as const,
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    operationalStatus: estaActivo ? 'active' as const : 'restricted' as const,
                    equipmentType: 'rtg' as const,
                    ocupacionPorTurno: optimizationMetrics.evolucionTemporal?.map((t: any) =>
                        Math.round(t.ocupacionPromedio || 0)
                    ) || [],
                    stats: createCompleteStats({
                        teusActuales: Math.round(blockData.teusPromedio),
                        bahiasTotales: 35,
                        entradas: blockData.movimientosRecepcion + blockData.movimientosDescarga,
                        salidas: blockData.movimientosCarga + blockData.movimientosEntrega,
                        remanejos: 0
                    }),
                    // Inyectar datos de optimización para que BloqueComponent los use siempre
                    optimizationModelData: blockData
                };
            });

            let ocupacionTotalPatio = 0;
            let descripcionTurno = '';

            if (currentTurno === 0) {
                ocupacionTotalPatio = optimizationMetrics.ocupacion?.promedio || 0;
                descripcionTurno = ' - Vista Semanal';
            } else if (currentTurno > 0 && currentTurno <= 21 && optimizationMetrics.evolucionTemporal) {
                const datosTurno = optimizationMetrics.evolucionTemporal[currentTurno - 1];
                ocupacionTotalPatio = datosTurno?.ocupacionPromedio || 0;
                const dia = Math.floor((currentTurno - 1) / 3) + 1;
                const turnoDelDia = ((currentTurno - 1) % 3) + 1;
                const nombresTurnos = ['Mañana', 'Tarde', 'Noche'];
                const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                descripcionTurno = ` - ${diasSemana[dia - 1]} ${nombresTurnos[turnoDelDia - 1]}`;
            }

            return {
                id: 'costanera',
                name: `Patio Costanera - Modelo ${activeModelName === 'e-constraint' ? 'E-Constraint' : activeModelName.charAt(0).toUpperCase() + activeModelName.slice(1)}`,
                type: 'contenedores',
                bloques: bloquesOptimizados,
                ocupacionTotal: Math.round(ocupacionTotalPatio),
                bounds: { x: 0, y: 0, width: 1000, height: 600 },
                description: `${optimizationMetrics.anio || 2022} - Semana ${optimizationMetrics.semana || 'N/A'} - P${optimizationMetrics.participacion || 'N/A'}%${descripcionTurno}`,
                operatingHours: { start: '00:00', end: '23:59' },
                restrictions: []
            };
        }

        // Procesar datos de Camila
        if (isCamilaActive && camilaData) {
            const data: any = camilaData;
            const sourceBloques = data.ocupacion_patio || data.ocupacion_por_bloque || data.bloques || [];
            const bloquesIds = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];

            const bloquesOptimizados: BloqueDataExtended[] = bloquesIds.map(bloqueId =>{
                const dataBloque = sourceBloques.find((b: any)=> b.bloque === bloqueId || b.id === bloqueId || b.codigo === bloqueId)
                const ocupacion = Number(dataBloque?.ocupacion_promedio || dataBloque?.utilizacion || 0);            
                const capacidad = Number(dataBloque?.capacidad || 350);
                const teus = Number(dataBloque?.teus_promedio || dataBloque?.teus || 0);
                const gateIn = Number(dataBloque?.movimientosRecepcion || 0);
                const gateOut = Number(dataBloque?.movimientosEntrega || 0);
                const muelleIn = Number(dataBloque?.movimientosDescarga || 0);
                const muelleOut = Number(dataBloque?.movimientosCarga || 0);
                const totalMovs = gateIn + gateOut + muelleIn + muelleOut;
                const remanejos = Number(dataBloque?.remanejos || dataBloque?.despejes || 0);

                return{
                    id: bloqueId,
                    patioId: patioId,
                    name: `Bloque ${bloqueId}`,
                    ocupacion: Math.round(ocupacion),
                    capacidadTotal: capacidad,
                    bahias: [],
                    tipo: 'contenedores' as const,
                    bounds: {x:0, y: 0, width: 100, height: 100},
                    operationalStatus: (ocupacion > 0 || totalMovs > 0) ? 'active' : 'restricted',
                    equipmentType: 'rtg' as const,
                    ocupacionPorTurno: [],
                    stats: createCompleteStats({
                        teusActuales: Math.round(teus),
                        gate:{ entradas: gateIn, salidas: gateOut },
                        muelle:{ entradas: muelleIn, salidas: muelleOut },
                        entradas: gateIn + muelleIn,
                        salidas: gateOut + muelleOut,
                        remanejos: remanejos
                    })
                };
            });

            const kpis = data.kpis_generales || data.kpis || {};
            const ocupacionTotalPatio = Number(kpis.ocupacion_promedio || kpis.utilizacion_global || 0);

            return{
                id: 'costanera',
                name: 'Patio costanera - Modelo Camila',
                type: 'contenedores',
                bloques: bloquesOptimizados,
                ocupacionTotal: Math.round(ocupacionTotalPatio),
                bounds: { x: 0, y: 0, width: 1000, height: 600 },
                description: `Camila - Sem ${camilaData.metadata?.semana || '?'} (Acc: ${kpis.accuracy_global || 0}%)`,
                operatingHours: {start: '00:00', end: '23:59'}
            };
        }

        // Procesar datos históricos
        if (timeState?.dataSource === 'historical' && realPatioData) {
            if (realPatioData.patios && Array.isArray(realPatioData.patios)) {
                const patioReal = realPatioData.patios.find((p: any) => p.id === patioId);
                if (patioReal) {
                    // Si hay métricas de referencia, enriquecemos los bloques con datos de optimización para comparación
                    if (referenceMetrics && patioId === 'costanera') {
                        const bloquesIds = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9'];
                        const bloquesConComparacion = patioReal.bloques.map((bloque: any) => {
                            if (bloquesIds.includes(bloque.id)) {
                                const optBlockData = getOptimizationModelDataForBlock(
                                    bloque.id,
                                    referenceMetrics,
                                    currentTurno,
                                    null, // No pasamos referencia extra aquí, el helper ya maneja comparisonType
                                    comparisonType
                                );
                                
                                return {
                                    ...bloque,
                                    optimizationModelData: optBlockData
                                };
                            }
                            return bloque;
                        });

                        return {
                            ...patioReal,
                            bloques: bloquesConComparacion
                        };
                    }
                    return patioReal;
                }
            }
            return createDefaultPatio(patioId);
        }

        return createDefaultPatio(patioId);

    } catch (error) {
        console.error('Error procesando datos del patio:', error);
        return createDefaultPatio(patioId);
    }
};

function createDefaultPatio(patioId: string): PatioData {
    const bloques: BloqueDataExtended[] = [];
    for (let i = 1; i <= 9; i++) {
        bloques.push({
            id: `C${i}`,
            patioId: patioId,
            name: `Bloque C${i}`,
            ocupacion: 0,
            capacidadTotal: 350,
            bahias: [],
            tipo: 'contenedores' as const,
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            operationalStatus: 'active' as const,
            equipmentType: 'rtg' as const,
            stats: createCompleteStats()
        });
    }

    return {
        id: patioId,
        name: `Patio ${patioId.charAt(0).toUpperCase() + patioId.slice(1)}`,
        type: 'contenedores',
        bloques: bloques,
        ocupacionTotal: 0,
        bounds: { x: 0, y: 0, width: 1000, height: 600 },
        description: 'Sin datos disponibles',
        operatingHours: { start: '00:00', end: '23:59' },
        restrictions: []
    };
}