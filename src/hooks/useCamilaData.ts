// src/hooks/useCamilaData.ts

import { useState, useEffect, useCallback } from 'react';
import { camilaService } from '../services/camilaViewsApi';
import type {
    CamilaConfig,
    DashboardEjecutivoResponse,
    CamilaEstadisticas,
    CamilaComparacionTemporal,
    CamilaAnalisisAccuracy,
    CamilaResultadosList,
    CamilaCuotasDetalle,
    CamilaMetricasGruas,
    CamilaAgrupacionHora,
    CamilaLogProcesamiento,
    FiltrosDisponibles
} from '../types/camila';


// Hook principal para el dashboard
export const useCamilaDashboard = (config: CamilaConfig | null) => {
    const [data, setData] = useState<DashboardEjecutivoResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!config) {
            console.log('🔴 useCamilaDashboard: No hay configuración');
            setData(null);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔵 useCamilaDashboard: Fetching con config:', config);

                const dashboardData = await camilaService.getDashboard(config);
                setData(dashboardData);

            } catch (err) {
                console.error('🔴 useCamilaDashboard: Error:', err);
                setError(err instanceof Error ? err.message : 'Error desconocido');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config]);

    return { data, loading, error };
};

// Hook para estadísticas generales
export function useCamilaEstadisticas() {
    const [data, setData] = useState<CamilaEstadisticas | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await camilaService.getEstadisticas();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}
// Agregar este hook en src/hooks/useCamilaData.ts

export function useFiltrosDisponibles() {
    const [data, setData] = useState<FiltrosDisponibles | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const result = await camilaService.getFiltrosDisponibles();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar filtros');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
}
// Hook para comparación temporal
export function useCamilaComparacionTemporal(
    config: Omit<CamilaConfig, 'turno'> | null,
    incluirDetalles: boolean = false
) {
    const [data, setData] = useState<CamilaComparacionTemporal | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!config) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getComparacionTemporal(config, incluirDetalles);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar comparación');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config, incluirDetalles]);

    return { data, loading, error };
}

// Hook para análisis de accuracy
export function useCamilaAnalisisAccuracy(filters?: {
    anio?: number;
    semana?: number;
    participacion?: number;
    min_accuracy?: number;
    max_accuracy?: number;
    limit?: number;
}) {
    const [data, setData] = useState<CamilaAnalisisAccuracy | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await camilaService.getAnalisisAccuracy(filters);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar análisis de accuracy');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

// Hook para resultados disponibles con paginación
export function useResultadosDisponibles(filters?: {
    anio?: number;
    semana?: number;
    turno?: number;
    participacion?: number;
    con_dispersion?: boolean;
    con_comparacion_real?: boolean;
    limit?: number;
    offset?: number;
    ordenar_por?: 'fecha' | 'accuracy' | 'utilizacion';
    orden?: 'asc' | 'desc';
}) {
    const [data, setData] = useState<CamilaResultadosList | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await camilaService.getResultadosDisponibles(filters);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar resultados');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [JSON.stringify(filters)]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

// Hook para detalle de cuotas
export function useCamilaCuotas(resultadoId: string | null) {
    const [data, setData] = useState<CamilaCuotasDetalle | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resultadoId) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getCuotasDetalle(resultadoId);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar cuotas');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resultadoId]);

    return { data, loading, error };
}

// Hook para métricas de grúas
export function useCamilaMetricasGruas(config: {
    anio?: number;
    semana: number;
    turno?: number;
    participacion: number;
    dispersion?: string;
} | null) {
    const [data, setData] = useState<CamilaMetricasGruas | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!config) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getMetricasGruas(config);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar métricas de grúas');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config]);

    return { data, loading, error };
}

// Hook para agrupación por hora
export function useCamilaAgrupacionHora(config: {
    anio?: number;
    semana: number;
    participacion: number;
    dispersion?: string;
} | null) {
    const [data, setData] = useState<CamilaAgrupacionHora[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!config) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getAgrupacionPorHora({
                    ...config,
                    agrupacion: 'hora'
                });
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar datos por hora');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [config]);

    return { data, loading, error };
}

// Hook para logs de procesamiento
export function useCamilaLogs(resultadoId: string | null) {
    const [data, setData] = useState<{
        resultado_id: string;
        codigo: string;
        total_logs: number;
        logs: CamilaLogProcesamiento[];
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!resultadoId) {
            setData(null);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getLogs(resultadoId);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar logs');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [resultadoId]);

    return { data, loading, error };
}

// Hook personalizado para resumen de accuracy
export function useCamilaResumenAccuracy(anio: number, semana: number) {
    const [data, setData] = useState<{
        accuracy_promedio: number;
        turnos_con_datos: number;
        turnos_totales: number;
        mejor_accuracy: number;
        peor_accuracy: number;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const result = await camilaService.getResumenAccuracySemana(anio, semana);
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar resumen de accuracy');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [anio, semana]);

    return { data, loading, error };
}

// Hook para comparar múltiples configuraciones
export function useCamilaComparacionMultiple(configs: CamilaConfig[]) {
    const [data, setData] = useState<Map<string, DashboardEjecutivoResponse>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (configs.length === 0) {
            setData(new Map());
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const promises = configs.map(config =>
                camilaService.getDashboard(config)
                    .then(result => ({
                        key: `S${config.semana}_T${config.turno || 'todos'}`,
                        data: result
                    }))
            );

            const results = await Promise.all(promises);
            const newData = new Map<string, DashboardEjecutivoResponse>();

            results.forEach(({ key, data: resultData }) => {
                newData.set(key, resultData);
            });

            setData(newData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar comparaciones');
            setData(new Map());
        } finally {
            setLoading(false);
        }
    }, [configs]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}

// Hook para manejar exportación
export function useCamilaExport() {
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const exportData = useCallback(async (config: CamilaConfig, formato: 'excel' | 'csv' = 'excel') => {
        setExporting(true);
        setError(null);

        try {
            await camilaService.exportarResultados(config, formato);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al exportar');
            console.error('Error exportando:', err);
        } finally {
            setExporting(false);
        }
    }, []);

    return { exportData, exporting, error };
}

// Hook genérico para refrescar datos
export function useRefreshInterval<T>(
    fetchFunction: () => Promise<T>,
    interval: number | null = null
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction]);

    useEffect(() => {
        fetchData();

        if (interval) {
            const intervalId = setInterval(fetchData, interval);
            return () => clearInterval(intervalId);
        }
    }, [fetchData, interval]);

    return { data, loading, error, refetch: fetchData };
}