// src/types/patioView.types.ts
import type { CamilaDashboardData } from '../types/camila';
import type { BloqueData, PatioData } from '../types';

export interface BloqueDataExtended extends BloqueData {
    ocupacionPromedio?: number;
    ocupacionPorTurno?: number[];
    stats?: {
        // Datos básicos
        teusActuales: number;
        bahiasTotales: number;
        bahiasReefer: number;

        // Gate
        gate: {
            entradas: number;
            salidas: number;
        };
        gateEntradas: number;
        gateSalidas: number;

        // Muelle
        muelle: {
            entradas: number;
            salidas: number;
        };
        muelleEntradas: number;
        muelleSalidas: number;

        // Despejos
        despejes: number;
        despejosBloques: number;  // Entre bloques del mismo patio
        despejosPatios: number;   // Entre diferentes patios

        // Reubicaciones
        reubicacionesEntreBloques: number;
        reubicacionesEntrePatios: number;

        // Movimientos generales
        entradas: number;
        salidas: number;
        remanejos: number;

        // Bahías
        bahias: number;  // Total de bahías (alternativa a bahiasTotales)
    };
}
export interface BloqueStats {
    // Datos básicos
    teusActuales: number;
    bahiasTotales: number;
    bahiasReefer: number;

    // Gate
    gate: {
        entradas: number;
        salidas: number;
    };
    gateEntradas: number;
    gateSalidas: number;

    // Muelle
    muelle: {
        entradas: number;
        salidas: number;
    };
    muelleEntradas: number;
    muelleSalidas: number;

    // Despejos
    despejes: number;
    despejosBloques: number;
    despejosPatios: number;

    // Reubicaciones
    reubicacionesEntreBloques: number;
    reubicacionesEntrePatios: number;

    // Movimientos generales
    entradas: number;
    salidas: number;
    remanejos: number;

    // Bahías
    bahias: number;
}

export interface BloqueDataExtended extends BloqueData {
    ocupacionPromedio?: number;
    ocupacionPorTurno?: number[];
    stats?: BloqueStats; // Usar la interfaz completa
}
export interface CamilaBlockData {
    asignaciones: {
        grua_id: number;
        bloque_codigo: string;
        periodo: number;
        asignada: boolean;
        activada: boolean;
        movimientos_asignados: number;
    }[];
    gruas: number[];
    metricas: {
        grua_id: number;
        movimientos_modelo: number;
        bloques_visitados: number;
        periodos_activa: number;
        cambios_bloque: number;
        tiempo_productivo_hrs: number;
        tiempo_improductivo_hrs: number;
        utilizacion_pct: number;
        movimientos_reales_estimados?: number;
        diferencia_vs_real?: number;
    }[];
    cuotas?: {
        periodo: number;
        bloque_codigo: string;
        cuota_modelo: number;
        capacidad_maxima: number;
        gruas_asignadas: number;
        movimientos_reales?: number;
        utilizacion_real?: number;
        tipo_operacion: string;
        segregaciones: string[];
    };
}

export interface OptimizationModelBlockData {
    segregaciones: number;
    ocupacionPromedio: number;
    ocupacionMaxima: number;
    ocupacionMinima: number;
    ocupacionTurno: number;
    movimientos: number;
    capacidad: number;

    // Nuevas métricas
    cargaTrabajo: number;
    cargaMaxima: number;
    cargaMinima: number;
    variacionCarga: number;

    // Movimientos detallados
    movimientosRecepcion: number;
    movimientosCarga: number;
    movimientosDescarga: number;
    movimientosEntrega: number;
    movimientosTotales: number;

    // Información de segregaciones
    segregacionesCodigos: string[];
    segregacionesDetalle: Array<{
        codigo: string;
        descripcion: string;
        movimientos: number;
    }>;

    // Eficiencia del bloque
    utilizacionPromedio: number;
    rangoOcupacion: number;

    // TEUs y volumen
    teusPromedio: number;
    volumenTotal: number;

    // Datos históricos para comparación
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

    // Métricas de comparación
    comparacion?: {
        gateReduccion: number;
        muelleReduccion: number;
        totalReduccion: number;
        yardEliminados: number;
        ocupacionMejora: number;
    };
}

// ALIAS TEMPORAL
export type MagdalenaBlockData = OptimizationModelBlockData;

export interface BloqueComponentProps {
    bloque: BloqueDataExtended;
    isSelected: boolean;
    onClick: () => void;
    getColorForOcupacion: (value: number) => string;
    isMagdalenaActive?: boolean;
    isCamilaActive?: boolean;
    ocupacionTurno?: number;
    camilaData?: CamilaBlockData;
    currentPeriod?: number;
    dashboardData?: CamilaDashboardData;
    magdalenaData?: MagdalenaBlockData;
}