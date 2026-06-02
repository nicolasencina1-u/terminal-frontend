// src/components/map/views/patio/patioDataHelpers.ts

import type { DashboardEjecutivoResponse, CamilaDashboardData } from '../../../../types/camila';
import type { OptimizationMetrics } from '../../../../types/optimization';

export type comparisonSource = 'historico' | 'magdalena' | 'pipeline' | 'e-constraint';

export interface OptimizationModelBlockData {
    segregaciones: number;
    ocupacionPromedio: number;
    ocupacionMaxima: number;
    ocupacionMinima: number;
    ocupacionTurno: number;
    movimientos: number;
    capacidad: number;
    cargaTrabajo: number;
    cargaMaxima: number;
    cargaMinima: number;
    variacionCarga: number;
    movimientosRecepcion: number;
    movimientosCarga: number;
    movimientosDescarga: number;
    movimientosEntrega: number;
    movimientosTotales: number;
    segregacionesCodigos: string[];
    segregacionesDetalle: Array<{
        codigo: string;
        descripcion: string;
        movimientos: number;
    }>;
    utilizacionPromedio: number;
    rangoOcupacion: number;
    teusPromedio: number;
    volumenTotal: number;
    historico?: {
        gateEntradas: number;
        gateSalidas: number;
        muelleEntradas: number;
        muelleSalidas: number;
        totalMovimientos: number;
        yardMovimientos: number;
        despejosBloques: number;
        despejosPatios: number;
        ocupacion: number;
    };
    comparacion?: {
        gateReduccion: number;
        muelleReduccion: number;
        totalReduccion: number;
        yardEliminados: number;
        ocupacionMejora: number;
        comparedAgainst: comparisonSource;
    };
}

const modelStats = (
    bloqueId: string,
    metrics: OptimizationMetrics,
    currentTurno?: number,
    isReferenceHistorical: boolean = false
) => {
    const bloqueData = metrics?.ocupacion?.porBloque?.find(b => b?.bloque === bloqueId);
    const bloquesActivos = metrics?.ocupacion?.porBloque?.filter(b => b.ocupacionPromedio > 0).length || 9;

    const factorBloque = bloqueData?.ocupacionPromedio && metrics.ocupacion?.promedio ?
        bloqueData.ocupacionPromedio / metrics.ocupacion.promedio : 0;

    const factorMovimientos = (factorBloque / bloquesActivos) || 0;
    
    const isWeekly = !currentTurno || currentTurno === 0;

    // CÃ¡lculo de movimientos totales (movTotal) y yard (yardTotal)
    let movTotal = 0;
    let yardTotal = 0;

    if (metrics.evolucionTemporal && metrics.evolucionTemporal.length > 0) {
        if (isWeekly) {
            // VISTA SEMANAL: Sumar TODOS los turnos (usualmente 21)
            metrics.evolucionTemporal.forEach(turno => {
                movTotal += isReferenceHistorical ? (turno.movimientosReal || 0) : (turno.movimientosModelo || 0);
                yardTotal += isReferenceHistorical ? (turno.movimientosYard || 0) : 0;
            });
        } else if (currentTurno && currentTurno > 0 && metrics.evolucionTemporal.length >= currentTurno) {
            // VISTA POR TURNO
            const turno = metrics.evolucionTemporal[currentTurno - 1];
            movTotal = isReferenceHistorical ? (turno.movimientosReal || 0) : (turno.movimientosModelo || 0);
            yardTotal = isReferenceHistorical ? (turno.movimientosYard || 0) : 0;
        }
    } else {
        // Fallback a los totales generales
        movTotal = isReferenceHistorical ? (metrics.movimientos?.totalReal || 0) : 
                   (metrics.movimientos?.optimizados || 0);
        yardTotal = isReferenceHistorical ? (metrics.movimientos?.yardEliminados || 0) : 0;
    }

    // DistribuciÃ³n por tipo (estimada si no viene del backend por bloque)
    const opt = isReferenceHistorical ? 
        { 
            recepcion: movTotal * 0.45, 
            carga: movTotal * 0.25, 
            descarga: movTotal * 0.15, 
            entrega: movTotal * 0.15 
        } : 
        {
            recepcion: movTotal * 0.45,
            carga: movTotal * 0.25,
            descarga: movTotal * 0.15,
            entrega: movTotal * 0.15
        };

    // Aplicamos el factor del bloque al total (sin distribuir por nÃºmero de bloques para mantener consistencia con vista turno)
    const multiplier = factorBloque || 1;
    
    return {
        ocupacion: (isWeekly ? (bloqueData?.ocupacionPromedio || 0) : ((metrics.evolucionTemporal?.[currentTurno - 1]?.ocupacionPromedio || 0) * factorBloque)),
        gate: Math.round((opt.recepcion + opt.entrega) * multiplier),
        muelle: Math.round((opt.carga + opt.descarga) * multiplier),
        total: Math.round(movTotal * multiplier),
        yard: Math.round(yardTotal * multiplier),
        bloqueData
    };
}

export const getCamilaDataForBlock = (
    bloqueId: string,
    activeMetrics: OptimizationMetrics | null | undefined,
    referenceMetrics: OptimizationMetrics | null,
    currentTurno?: number,
    comparisonType: comparisonSource = 'historico'
) : OptimizationModelBlockData | null => {
    if (!activeMetrics) return null;
    try {
        // Stats del modelo activo (el que se está viendo)
        const statsA = modelStats(bloqueId, activeMetrics, currentTurno, false);
        const bloqueData = statsA.bloqueData;
        const capacidadBloque = bloqueData?.capacidad || 350;

        let statsRef;
        if(referenceMetrics){
            // Si hay métricas de referencia (otro modelo o el mismo con datos reales), las usamos
            // Si el comparisonType es 'historico', le decimos a modelStats que extraiga los datos 'Real'
            statsRef = modelStats(bloqueId, referenceMetrics, currentTurno, comparisonType === 'historico');
        } else {
            // Fallback: estimación si no hay métricas de referencia cargadas
            const factorBloque = bloqueData?.ocupacionPromedio && activeMetrics.ocupacion?.promedio ?
                bloqueData.ocupacionPromedio / activeMetrics.ocupacion.promedio : 0;
                
            statsRef = {
                gate: Math.round((statsA.total * 1.3) * 0.65),
                muelle: Math.round((statsA.total * 1.3) * 0.35),
                total: Math.round(statsA.total * 1.3),
                yard: Math.round(statsA.total * 0.2),
                ocupacion: (bloqueData?.ocupacionPromedio || 0) * 1.3
            };
        }

        const comparacion: OptimizationModelBlockData['comparacion'] = {
            gateReduccion: statsRef.gate > 0 ? ((statsRef.gate - statsA.gate) / statsRef.gate * 100) : 0,
            muelleReduccion: statsRef.muelle > 0 ? ((statsRef.muelle - statsA.muelle) / statsRef.muelle * 100) : 0,
            totalReduccion: statsRef.total > 0 ? ((statsRef.total - statsA.total) / statsRef.total * 100) : 0,
            yardEliminados: statsRef.yard,
            ocupacionMejora: statsRef.ocupacion > 0 ? ((statsRef.ocupacion - statsA.ocupacion) / statsRef.ocupacion * 100) : 0,
            comparedAgainst: comparisonType
        };
        return {
            segregaciones: Math.round((activeMetrics.segregaciones?.activas?.length || 0) * ((bloqueData?.ocupacionPromedio || 0) / activeMetrics.ocupacion.promedio) * 0.3),
            ocupacionPromedio: bloqueData?.ocupacionPromedio || 0,
            ocupacionMaxima: bloqueData?.ocupacionMaxima || 100,
            ocupacionMinima: bloqueData?.ocupacionMinima || 0,
            ocupacionTurno: Math.min(100, Math.round(statsA.ocupacion)),
            movimientos: statsA.total,
            capacidad: capacidadBloque,
            cargaTrabajo: Math.round((activeMetrics.cargaTrabajo?.total || 0) / 9),
            cargaMaxima: Math.round((activeMetrics.cargaTrabajo?.maxima || 0)),
            cargaMinima: Math.round((activeMetrics.cargaTrabajo?.minima || 0)),
            variacionCarga: Math.round((activeMetrics.cargaTrabajo?.maxima || 0) - (activeMetrics.cargaTrabajo?.minima || 0)),
            movimientosRecepcion: Math.round((activeMetrics.movimientos?.optimizadosPorTipo?.recepcion || 0) * (statsA.ocupacion / activeMetrics.ocupacion.promedio / 9)),
            movimientosCarga: Math.round((activeMetrics.movimientos?.optimizadosPorTipo?.carga || 0) * (statsA.ocupacion / activeMetrics.ocupacion.promedio / 9)),
            movimientosDescarga: Math.round((activeMetrics.movimientos?.optimizadosPorTipo?.descarga || 0) * (statsA.ocupacion / activeMetrics.ocupacion.promedio / 9)),
            movimientosEntrega: Math.round((activeMetrics.movimientos?.optimizadosPorTipo?.entrega || 0) * (statsA.ocupacion / activeMetrics.ocupacion.promedio / 9)),
            movimientosTotales: statsA.total,
            segregacionesCodigos: [],
            segregacionesDetalle: [],
            utilizacionPromedio: bloqueData?.utilizacion || bloqueData?.ocupacionPromedio || 0,
            rangoOcupacion: (bloqueData?.ocupacionMaxima || 100) - (bloqueData?.ocupacionMinima || 0),
            teusPromedio: Math.round(capacidadBloque * (bloqueData?.ocupacionPromedio || 0) / 100),
            volumenTotal: statsA.total * 1.5,
            comparacion
        };
    } catch (error) {
        console.error('Error en getCamilaDataForBlock:', error);
        return null;
    }
};

export const getCamilaDashboardDataForBlock = (bloqueId: string, dashboardData: DashboardEjecutivoResponse | null) => {
    if (!dashboardData?.tabs?.analisis_bloques) return null;
    const bloqueInfo = dashboardData.tabs.analisis_bloques.distribucion.find(b => b.bloque === bloqueId);
    if (!bloqueInfo) return null;
    return {
        movimientos: bloqueInfo.movimientos_total,
        porcentaje: bloqueInfo.porcentaje,
        desglose: bloqueInfo.desglose,
        comparacion: bloqueInfo.comparacion,
        esTop3: dashboardData.tabs.analisis_bloques.top_3_bloques.some(b => b.bloque === bloqueId),
        esCritico: dashboardData.tabs.analisis_bloques.bloques_criticos.some(b => b.bloque === bloqueId)
    };
};

export const getOptimizationModelDataForBlock = (
    bloqueId: string,
    optimizationMetrics: OptimizationMetrics | null | undefined,
    currentTurno?: number,
    referenceMetrics?: OptimizationMetrics | null,
    comparisonType: comparisonSource = 'historico'
): OptimizationModelBlockData | null => {
    if (!optimizationMetrics) return null;

    try {
        const statsA = modelStats(bloqueId, optimizationMetrics, currentTurno, false);
        const bloqueData = statsA.bloqueData;
        const capacidadBloque = bloqueData?.capacidad || 350;

        let statsRef;
        if (referenceMetrics) {
            statsRef = modelStats(bloqueId, referenceMetrics, currentTurno, comparisonType === 'historico');
        } else {
            // Fallback tradicional (extraer histórico estimado de las mismas métricas activas)
            const bloquesActivos = optimizationMetrics.ocupacion?.porBloque?.filter(b => b.ocupacionPromedio > 0).length || 9;
            const factorBloque = (bloqueData?.ocupacionPromedio && optimizationMetrics.ocupacion?.promedio) ?
                bloqueData.ocupacionPromedio / optimizationMetrics.ocupacion.promedio : 0;
            
            let movimientosRealTotal = (optimizationMetrics.movimientos?.totalReal || 0);
            let yardTotal = (optimizationMetrics.movimientos?.yardEliminados || 0);

            const movBloque = (movimientosRealTotal / bloquesActivos) * (factorBloque || 1);
            const yardBloque = (yardTotal / bloquesActivos) * (factorBloque || 1);
            
            statsRef = {
                gate: Math.round((movBloque - yardBloque) * 0.65),
                muelle: Math.round((movBloque - yardBloque) * 0.35),
                total: Math.round(movBloque),
                yard: Math.round(yardBloque),
                ocupacion: (bloqueData?.ocupacionPromedio || 0) * 1.3 // Estimación de ocupación real mayor
            };
        }

        const datosHistoricos: OptimizationModelBlockData['historico'] = {
            gateEntradas: Math.round(statsRef.gate * 0.4),
            gateSalidas: Math.round(statsRef.gate * 0.6),
            muelleEntradas: Math.round(statsRef.muelle * 0.5),
            muelleSalidas: Math.round(statsRef.muelle * 0.5),
            totalMovimientos: Math.round(statsRef.total),
            yardMovimientos: Math.round(statsRef.yard),
            despejosBloques: Math.round(statsRef.yard * 0.65),
            despejosPatios: Math.round(statsRef.yard * 0.35),
            ocupacion: Math.round(statsRef.ocupacion)
        };

        const teusPromedio = bloqueData?.teusPromedio || Math.round(capacidadBloque * (bloqueData?.ocupacionPromedio || 0) / 100);
        const utilizacionPromedio = bloqueData?.utilizacion || bloqueData?.ocupacionPromedio || 0;
        const rangoOcupacion = (bloqueData?.ocupacionMaxima || 100) - (bloqueData?.ocupacionMinima || 0);

        const comparacion: OptimizationModelBlockData['comparacion'] = {
            gateReduccion: statsRef.gate > 0 ? ((statsRef.gate - statsA.gate) / statsRef.gate * 100) : 0,
            muelleReduccion: statsRef.muelle > 0 ? ((statsRef.muelle - statsA.muelle) / statsRef.muelle * 100) : 0,
            totalReduccion: statsRef.total > 0 ? ((statsRef.total - statsA.total) / statsRef.total * 100) : 0,
            yardEliminados: statsRef.yard,
            ocupacionMejora: statsRef.ocupacion > 0 ? ((statsRef.ocupacion - statsA.ocupacion) / statsRef.ocupacion * 100) : 0,
            comparedAgainst: comparisonType
        };

        // Extraer movimientos detallados si vienen del backend
        const m = (bloqueData as any)?.movimientos;

        return {
            segregaciones: Math.round((optimizationMetrics.segregaciones?.activas?.length || 0) / 9),
            ocupacionPromedio: bloqueData?.ocupacionPromedio || 0,
            ocupacionMaxima: bloqueData?.ocupacionMaxima || 100,
            ocupacionMinima: bloqueData?.ocupacionMinima || 0,
            ocupacionTurno: Math.min(100, Math.round(statsA.ocupacion)),
            movimientos: statsA.total,
            capacidad: capacidadBloque,
            cargaTrabajo: Math.round((optimizationMetrics.cargaTrabajo?.total || 0) / 9),
            cargaMaxima: Math.round(optimizationMetrics.cargaTrabajo?.maxima || 0),
            cargaMinima: Math.round(optimizationMetrics.cargaTrabajo?.minima || 0),
            variacionCarga: Math.round((optimizationMetrics.cargaTrabajo?.maxima || 0) - (optimizationMetrics.cargaTrabajo?.minima || 0)),
            movimientosRecepcion: m ? m.recepcion : Math.round(statsA.gate * 0.4),
            movimientosCarga: m ? m.carga : Math.round(statsA.muelle * 0.6),
            movimientosDescarga: m ? m.descarga : Math.round(statsA.muelle * 0.4),
            movimientosEntrega: m ? m.entrega : Math.round(statsA.gate * 0.6),
            movimientosTotales: statsA.total,
            segregacionesCodigos: [],
            segregacionesDetalle: [],
            utilizacionPromedio,
            rangoOcupacion,
            teusPromedio,
            volumenTotal: statsA.total * 1.5,
            historico: datosHistoricos,
            comparacion
        };
    } catch (error) {
        console.error('Error en getOptimizationModelDataForBlock:', error);
        return null;
    }
};

export const getAggregatedStats = (
    optimizationMetrics: OptimizationMetrics | null | undefined,
    camilaData: CamilaDashboardData | DashboardEjecutivoResponse | null | undefined,
    currentPeriod: number
) => {
    const stats = {
        optimizationModel: {
            ocupacionPromedio: 0,
            segregacionesActivas: 0,
            movimientosOptimizados: 0,
            eficienciaGanada: 0,
            cargaTrabajoTotal: 0,
            distanciaAhorrada: 0,
            yardEliminados: 0
        },
        camila: {
            asignacionesActivas: 0,
            movimientosTotales: 0,
            gruasOperando: 0,
            bloquesActivos: 0
        }
    };

    if (optimizationMetrics) {
        stats.optimizationModel = {
            ocupacionPromedio: optimizationMetrics.ocupacion?.promedio || 0,
            segregacionesActivas: optimizationMetrics.segregaciones?.optimizadas || 0,
            movimientosOptimizados: optimizationMetrics.movimientos?.optimizados || 0,
            eficienciaGanada: optimizationMetrics.eficiencia?.ganancia || 0,
            cargaTrabajoTotal: optimizationMetrics.cargaTrabajo?.total || 0,
            distanciaAhorrada: optimizationMetrics.distancias?.distanciaAhorrada || 0,
            yardEliminados: optimizationMetrics.movimientos?.yardEliminados || 0
        };
    }

    if (camilaData) {
        if ('tabs' in camilaData && camilaData.tabs) {
            const vistaGeneral = camilaData.tabs.vista_general;
            const analisisBloques = camilaData.tabs.analisis_bloques;
            stats.camila = {
                asignacionesActivas: analisisBloques?.distribucion.filter(b => b.movimientos_total > 0).length || 0,
                movimientosTotales: vistaGeneral?.distribucion_flujos.total || 0,
                gruasOperando: vistaGeneral?.utilizacion_recursos.gruas.utilizadas || 0,
                bloquesActivos: analisisBloques?.distribucion.filter(b => b.movimientos_total > 0).length || 0
            };
        }
        else if ('asignaciones' in camilaData && camilaData.asignaciones) {
            const asignacionesPeriodo = camilaData.asignaciones.filter(a => a.periodo === currentPeriod && a.asignada);
            stats.camila = {
                asignacionesActivas: asignacionesPeriodo.length,
                movimientosTotales: asignacionesPeriodo.reduce((sum, a) => sum + a.movimientos_asignados, 0),
                gruasOperando: new Set(asignacionesPeriodo.map(a => a.grua_id)).size,
                bloquesActivos: new Set(asignacionesPeriodo.map(a => a.bloque_codigo)).size
            };
        }
    }
    return stats;
};

export const isDashboardEjecutivoResponse = (data: any): data is DashboardEjecutivoResponse => {
    return data && 'tabs' in data && data.tabs && 'vista_general' in data.tabs;
};

export const getGruasMetricsFromDashboard = (dashboardData: DashboardEjecutivoResponse | null) => {
    if (!dashboardData?.tabs?.metricas_gruas) return null;
    return {
        resumen: dashboardData.tabs.metricas_gruas.resumen,
        detalle: dashboardData.tabs.metricas_gruas.detalle_gruas,
        distribucion: dashboardData.tabs.metricas_gruas.distribucion_trabajo
    };
};

export const getTimelineFromDashboard = (dashboardData: DashboardEjecutivoResponse | null, currentPeriod: number) => {
    if (!dashboardData?.tabs?.timeline_operaciones) return null;
    const periodo = dashboardData.tabs.timeline_operaciones.periodos.find(p => p.periodo === currentPeriod);
    return {
        periodoActual: periodo,
        horasPico: dashboardData.tabs.timeline_operaciones.horas_pico,
        utilizacionPorHora: dashboardData.tabs.timeline_operaciones.utilizacion_por_hora
    };
};