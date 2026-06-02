// src/types/camila.ts

// Configuración principal para consultas
export interface CamilaConfig {
    semana: number;
    dia?: number;
    turno?: number;
    participacion: number;
    hora?: number;
    anio?: number;
    variant?: string;
    criterio?: number;
    granularidad?: string;
}

// Respuesta principal del Dashboard Ejecutivo
export interface DashboardEjecutivoResponse {
    metadata: {
        turno: number;
        fecha: string;
        dia_semana: number;
        hora_inicio: number;
        participacion: number;
        semana: number;
    };
    tabs: {
        vista_general: VistaGeneral;
        analisis_bloques: AnalisisBloques;
        comparacion_detallada: ComparacionDetallada;
        metricas_gruas: MetricasGruas;
        timeline_operaciones: TimelineOperaciones;
    };
}

// Vista General
export interface VistaGeneral {
    kpis_principales: {
        productividad: {
            valor: number;
            unidad: string;
            meta: number;
            cumplimiento_meta: number;
            estado: 'BUENO' | 'BAJO';
        };
        precision_modelo: {
            valor: number;
            unidad: string;
            categoria: 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'BAJO' | 'MUY_BAJO' | 'SIN_DATOS';
            score_coincidencia: number;
        };
        balance_flujos: {
            entradas: number;
            salidas: number;
            balance: number;
            categoria: string;
            alerta: boolean;
        };
        ahorro_distancia: {
            metros: number;
            minutos: number;
            porcentaje: number;
            valor_anual_usd: number;
        };
    };
    distribucion_flujos: {
        carga: number;
        descarga: number;
        entrega: number;
        recepcion: number;
        total: number;
        porcentajes: {
            carga: number;
            descarga: number;
            entrega: number;
            recepcion: number;
        };
    };
    utilizacion_recursos: {
        gruas: {
            total: number;
            utilizadas: number;
            porcentaje: number;
        };
        bloques: {
            mas_utilizado: string;
            concentracion_maxima: number;
            distribucion_balanceada: boolean;
        };
    };
}

// Análisis de Bloques
export interface AnalisisBloques {
    distribucion: DistribucionBloque[];
    top_3_bloques: DistribucionBloque[];
    bloques_criticos: BloqueCritico[];
    comparacion_visual: {
        bloques: string[];
        modelo: number[];
        real: number[];
        diferencias: number[];
    };
}

export interface DistribucionBloque {
    bloque: string;
    movimientos_total: number;
    porcentaje: number;
    desglose: {
        carga: number;
        descarga: number;
        entrega: number;
        recepcion: number;
    };
    comparacion?: {
        real: number;
        diferencia: number;
        diferencia_pct: number;
        match: boolean;
    };
}

export interface BloqueCritico {
    bloque: string;
    problema: 'SOBRE_UTILIZADO' | 'ALTA_DISCREPANCIA';
    porcentaje?: number;
    diferencia?: number;
}

// Comparación Detallada
export interface ComparacionDetallada {
    resumen: {
        movimientos_modelo: number;
        movimientos_real: number;
        coincidencia_total: number;
        diferencias_criticas: number;
    };
    por_tipo_flujo: ComparacionItem[];
    por_bloque: ComparacionItem[];
    diferencias_principales: DiferenciaPrincipal[];
}

export interface ComparacionItem {
    subtipo: string;
    modelo: number;
    real: number;
    match: boolean;
    diferencia: number;
    diferencia_pct: number;
    precision: number;
    categoria: string;
}

export interface DiferenciaPrincipal {
    tipo: string;
    subtipo: string;
    diferencia: number;
    diferencia_pct: number;
    modelo: number;
    real: number;
    requiere_accion: boolean;
}

// Métricas de Grúas
export interface MetricasGruas {
    resumen: {
        gruas_activas: number;
        productividad_promedio: number;
        balance_trabajo: number;
        cumplimiento_meta: {
            cumplen: number;
            no_cumplen: number;
            porcentaje: number;
        };
        
        utilizacion_gruas: {
            total: number;
            activas: number;
            porcentaje: number;
            categoria: 'OPTIMA' | 'SUBOPTIMA';
        };
        productividad_por_grua: {
            promedio: number;
            meta: number;
            cumple: boolean;
        };
        distribucion_carga: {
            cv: number;
            categoria: 'EQUILIBRADA' | 'DESEQUILIBRADA';
        };
        interferencia: {
            porcentaje: number;
            nivel: 'BAJO' | 'ALTO';
        };
        reasignaciones: {
            porcentaje: number;
            eficiencia: 'ALTA' | 'BAJA';
        };
        tiempo_respuesta: {
            sin_grua_pct: number;
            alerta: boolean;
        };
    };
    detalle_gruas: DetalleGrua[];
    distribucion_trabajo: {
        tipo: 'EQUITATIVA' | 'DESIGUAL' | 'MODERADA' | 'SIN_TRABAJO';
        indice_gini: number;
        gruas_80_20: number;
        porcentaje_80_20: number;
    };
    
    matriz_asignacion?: MatrizAsignacionGruas;
}
export interface MatrizAsignacionGruas {
    matriz: {
        [periodo: number]: {
            [bloque: string]: Array<{
                grua: number;
                movimientos: number;
                activada: boolean;
            }>;
        };
    };
    bloques: string[];
    periodos: number[];
    resumen: {
        bloques_totales: number;
        periodos_totales: number;
        asignaciones_totales: number;
        promedio_gruas_periodo: number;
    };
}
export interface DetalleGrua {
    grua_id: number;
    movimientos: number;
    movimientos_hora: number;
    bloques_visitados: number;
    periodos_activa: number;
    utilizacion: number;
    tiempo_productivo: number;
    tiempo_improductivo: number;
    cumple_meta: boolean;
    estado: 'ACTIVA' | 'INACTIVA';
}

// Timeline de Operaciones
export interface TimelineOperaciones {
    periodos: PeriodoOperacion[];
    horas_pico: number[];
    utilizacion_por_hora: UtilizacionHora[];
}

export interface PeriodoOperacion {
    periodo: number;
    hora: number;
    cuota_total: number;
    capacidad_total: number;
    movimientos_reales: number;
    bloques_activos: number;
    gruas_totales: number;
    utilizacion_modelo: number;
    utilizacion_real: number;
}

export interface UtilizacionHora {
    hora: number;
    periodo: number;
    utilizacion_modelo: number;
    utilizacion_real: number;
    brecha: number;
}

// Filtros Disponibles
export interface FiltrosDisponibles {
    anios: number[];
    semanas: number[];
    dias: number[];
    turnos: number[];
    participaciones: number[];
    horas: number[];
    descripciones: {
        dias: { [key: number]: string };
        turnos_del_dia: { [key: number]: string };
    };
}

// Tipos para compatibilidad con el sistema existente
export interface CamilaDashboardData {
    metadata?: {
        turno: number;
        fecha: string;
        dia_semana: number;
        hora_inicio: number;
        participacion: number;
        semana: number;
        total_turnos_agregados?: number;
        es_agregado?: boolean;
    };
    tabs?: {
        vista_general: VistaGeneral;
        analisis_bloques: AnalisisBloques;
        comparacion_detallada: ComparacionDetallada;
        metricas_gruas: MetricasGruas;
        timeline_operaciones: TimelineOperaciones;
    };
    
    resultado?: any;
    asignaciones?: any[];
    cuotas_camiones?: any[];
    metricas_gruas?: any[];
    flujos_modelo?: any[];
    comparaciones_real?: any[];
}

// Estadísticas agregadas (si se usan en otros lugares)
export interface CamilaEstadisticas {
    total_resultados: number;
    resultados_con_solucion: number;
    resultados_sin_solucion: number;
    accuracy_promedio: number;
    utilizacion_promedio: number;
    semanas_procesadas: number[];
    participaciones_procesadas: number[];
}

// Comparación temporal
export interface CamilaComparacionTemporal {
    semana: number;
    participacion: number;
    dispersion: string;
    turnos: Array<{
        turno: number;
        movimientos_modelo: number;
        movimientos_real: number;
        accuracy: number;
        gruas_utilizadas: number;
        bloques_visitados: number;
        estado: string;
    }>;
    metricas_agregadas: {
        total_movimientos_modelo: number;
        total_movimientos_real: number;
        accuracy_promedio: number;
        gruas_promedio: number;
        turnos_con_solucion: number;
        turnos_sin_solucion: number;
    };
}

// Análisis de Accuracy
export interface CamilaAnalisisAccuracy {
    distribucion_accuracy: Array<{
        rango: string;
        cantidad: number;
        porcentaje: number;
    }>;
    top_mejores: Array<{
        resultado_id: string;
        codigo: string;
        accuracy: number;
        movimientos_modelo: number;
        movimientos_real: number;
    }>;
    top_peores: Array<{
        resultado_id: string;
        codigo: string;
        accuracy: number;
        movimientos_modelo: number;
        movimientos_real: number;
    }>;
    estadisticas: {
        accuracy_promedio: number;
        accuracy_mediana: number;
        accuracy_desviacion: number;
        accuracy_minima: number;
        accuracy_maxima: number;
    };
}

// Lista de resultados
export interface CamilaResultadosList {
    resultados: Array<{
        resultado_id: string;
        codigo: string;
        anio: number;
        semana: number;
        turno: number;
        participacion: number;
        dispersion: string;
        fecha_inicio: string;
        fecha_fin: string;
        total_movimientos_modelo: number;
        total_movimientos_real?: number;
        accuracy?: number;
        estado: string;
        tiene_comparacion_real: boolean;
    }>;
    total: number;
    pagina: number;
    por_pagina: number;
}

// Detalle de cuotas
export interface CamilaCuotasDetalle {
    resultado_id: string;
    total_cuotas: number;
    cuotas: Array<{
        periodo: number;
        bloque_codigo: string;
        cuota_modelo: number;
        capacidad_maxima: number;
        movimientos_reales?: number;
        utilizacion: number;
        gruas_asignadas: number;
    }>;
    resumen_por_bloque: Array<{
        bloque: string;
        total_cuota: number;
        total_movimientos_reales: number;
        promedio_utilizacion: number;
    }>;
}

// Métricas de grúas agregadas
export interface CamilaMetricasGruas {
    resultado_id: string;
    total_gruas: number;
    gruas_activas: number;
    metricas: Array<{
        grua_id: number;
        movimientos_modelo: number;
        movimientos_real?: number;
        bloques_visitados: number;
        periodos_activa: number;
        utilizacion_pct: number;
        productividad_hora: number;
        cumple_meta: boolean;
    }>;
    estadisticas: {
        productividad_promedio: number;
        utilizacion_promedio: number;
        gruas_que_cumplen_meta: number;
        distribucion_trabajo_cv: number;
    };
}

// Agrupación por hora
export interface CamilaAgrupacionHora {
    hora: number;
    movimientos_totales: number;
    gruas_activas: number;
    bloques_activos: number;
    utilizacion_promedio: number;
    productividad_promedio: number;
}

// Log de procesamiento
export interface CamilaLogProcesamiento {
    timestamp: string;
    nivel: 'INFO' | 'WARNING' | 'ERROR';
    mensaje: string;
    detalles?: any;
}

// Tipos de exportación
export type ExportFormat = 'excel' | 'csv' | 'json';

// Tipos para gráficos y visualizaciones
export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
    }>;
}

// Tipos para filtros y búsqueda
export interface CamilaFilters {
    anio?: number;
    semana?: number;
    turno?: number;
    participacion?: number;
    dispersion?: 'K' | 'N';
    con_solucion?: boolean;
    con_comparacion_real?: boolean;
    fecha_desde?: string;
    fecha_hasta?: string;
    ordenar_por?: 'fecha' | 'accuracy' | 'utilizacion' | 'movimientos';
    orden?: 'asc' | 'desc';
    limite?: number;
    offset?: number;
}

// Estado de procesamiento
export type EstadoProcesamiento =
    | 'PENDIENTE'
    | 'PROCESANDO'
    | 'COMPLETADO'
    | 'ERROR';

// Tipos de operación
export type TipoOperacion =
    | 'CARGA'
    | 'DESCARGA'
    | 'ENTREGA'
    | 'RECEPCION';

// Respuesta de error estándar
export interface ErrorResponse {
    detail: string;
    status_code?: number;
    type?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
}


export type CamilaGranularidad = {
    SEMANA_COMPLETA: 'semana_completa',
    DIA: 'dia',
    TURNO: 'turno',
    HORA: 'hora'
}

export interface CamilaConfigExtended extends CamilaConfig {
    granularidad: CamilaGranularidad;
}