// src/services/camilaViewsApi.ts

import type {
    CamilaConfig,
    DashboardEjecutivoResponse,
    FiltrosDisponibles,
    CamilaEstadisticas,
    CamilaComparacionTemporal,
    CamilaAnalisisAccuracy,
    CamilaResultadosList,
    CamilaCuotasDetalle,
    CamilaMetricasGruas,
    CamilaAgrupacionHora,
    CamilaLogProcesamiento
} from '../types/camila';

class CamilaViewsService {
    private baseUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/v1/camila`
        : 'http://localhost:8000/api/v1/camila';

    constructor() {
        console.log('🚀 CamilaViewsService inicializado con baseUrl:', this.baseUrl);
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}`);
        }
        return response.json();
    }


    private buildQueryParams(config: Partial<CamilaConfig>): URLSearchParams {
        const params = new URLSearchParams();

        // Siempre incluir año si está disponible
        if (config.anio !== undefined) params.append('anio', config.anio.toString());
        if (config.semana !== undefined) params.append('semana', config.semana.toString());

        // Solo incluir estos parámetros si no es vista de semana completa
        if (config.dia !== undefined) params.append('dia', config.dia.toString());
        if (config.turno !== undefined) params.append('turno', config.turno.toString());
        if (config.participacion !== undefined) params.append('participacion', config.participacion.toString());
        else params.append('participacion', '68');
        if (config.hora !== undefined) params.append('hora', config.hora.toString());

        if (config.variant !== undefined) params.append('variant', config.variant);
        else params.append('variant', 'magdalena');

        if (config.criterio !== undefined) params.append('criterio', config.criterio.toString());
        else params.append('criterio', '2'); // Fallback Criterio 2

        if (config.granularidad !== undefined) params.append('granularidad', config.granularidad);
        else params.append('granularidad', 'bahia'); // Fallback Bahía

        return params;
    }

    // Método principal - Dashboard Ejecutivo
    async getDashboard(config: CamilaConfig): Promise<DashboardEjecutivoResponse> {
        const params = this.buildQueryParams(config);
        console.log('🚀🚀 fetch:', `${this.baseUrl}/dashboard-ejecutivo?${params}`);
        const response = await fetch(`${this.baseUrl}/dashboard-ejecutivo?${params}`);
        return this.handleResponse<DashboardEjecutivoResponse>(response);
    }

    async getDashboardEjecutivo(config: CamilaConfig): Promise<DashboardEjecutivoResponse> {
        return this.getDashboard(config);
    }

    async getFiltrosDisponibles(): Promise<FiltrosDisponibles> {
        console.log('🚀🚀 fetch:', `${this.baseUrl}/filtros-disponibles`);
        const response = await fetch(`${this.baseUrl}/filtros-disponibles`);
        return this.handleResponse<FiltrosDisponibles>(response);
    }

    // Métodos adicionales para otros endpoints
    async getEstadisticas(): Promise<CamilaEstadisticas> {
        console.log('🚀🚀 fetch:', `${this.baseUrl}/estadisticas`);
        const response = await fetch(`${this.baseUrl}/estadisticas`);
        return this.handleResponse<CamilaEstadisticas>(response);
    }

    async getComparacionTemporal(
        config: Omit<CamilaConfig, 'turno'>,
        incluirDetalles: boolean = false
    ): Promise<CamilaComparacionTemporal> {
        const params = this.buildQueryParams(config);
        params.append('incluir_detalles', incluirDetalles.toString());
        console.log('🚀🚀 fetch:', `${this.baseUrl}/comparacion-temporal?${params}`);
        const response = await fetch(`${this.baseUrl}/comparacion-temporal?${params}`);
        return this.handleResponse<CamilaComparacionTemporal>(response);
    }

    async getAnalisisAccuracy(filters?: any): Promise<CamilaAnalisisAccuracy> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) params.append(key, value.toString());
            });
        }
        console.log('🚀🚀 fetch:', `${this.baseUrl}/analisis-accuracy?${params}`);
        const response = await fetch(`${this.baseUrl}/analisis-accuracy?${params}`);
        return this.handleResponse<CamilaAnalisisAccuracy>(response);
    }

    async getResultadosDisponibles(filters?: any): Promise<CamilaResultadosList> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) params.append(key, value.toString());
            });
        }
        console.log('🚀🚀 fetch:', `${this.baseUrl}/resultados?${params}`);
        const response = await fetch(`${this.baseUrl}/resultados?${params}`);
        return this.handleResponse<CamilaResultadosList>(response);
    }

    async getCuotasDetalle(resultadoId: string): Promise<CamilaCuotasDetalle> {
        console.log('🚀🚀 fetch:', `${this.baseUrl}/cuotas/${resultadoId}`);
        const response = await fetch(`${this.baseUrl}/cuotas/${resultadoId}`);
        return this.handleResponse<CamilaCuotasDetalle>(response);
    }

    async getMetricasGruas(config: any): Promise<CamilaMetricasGruas> {
        const params = new URLSearchParams();
        Object.entries(config).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.append(key, value.toString());
        });
        console.log('🚀🚀 fetch:', `${this.baseUrl}/metricas-gruas?${params}`);
        const response = await fetch(`${this.baseUrl}/metricas-gruas?${params}`);
        return this.handleResponse<CamilaMetricasGruas>(response);
    }

    async getAgrupacionPorHora(config: any): Promise<CamilaAgrupacionHora[]> {
        const params = new URLSearchParams();
        Object.entries(config).forEach(([key, value]) => {
            if (value !== undefined && value !== null) params.append(key, value.toString());
        });
        console.log('🚀🚀 fetch:', `${this.baseUrl}/agrupacion-hora?${params}`);
        const response = await fetch(`${this.baseUrl}/agrupacion-hora?${params}`);
        return this.handleResponse<CamilaAgrupacionHora[]>(response);
    }

    async getLogs(resultadoId: string): Promise<{
        resultado_id: string;
        codigo: string;
        total_logs: number;
        logs: CamilaLogProcesamiento[];
    }> {
        console.log('🚀🚀 fetch:', `${this.baseUrl}/logs/${resultadoId}`);
        const response = await fetch(`${this.baseUrl}/logs/${resultadoId}`);
        return this.handleResponse(response);
    }

    async getResumenAccuracySemana(anio: number, semana: number): Promise<{
        accuracy_promedio: number;
        turnos_con_datos: number;
        turnos_totales: number;
        mejor_accuracy: number;
        peor_accuracy: number;
    }> {
        console.log('🚀🚀 fetch:', `${this.baseUrl}/resumen-accuracy/${anio}/${semana}`);
        const response = await fetch(`${this.baseUrl}/resumen-accuracy/${anio}/${semana}`);
        return this.handleResponse(response);
    }

    async exportarResultados(config: CamilaConfig, formato: 'excel' | 'csv' = 'excel'): Promise<void> {
        const params = this.buildQueryParams(config);
        params.append('formato', formato);

        console.log('🚀🚀 fetch:', `${this.baseUrl}/exportar?${params}`);
        const response = await fetch(`${this.baseUrl}/exportar?${params}`);

        if (!response.ok) {
            throw new Error('Error al exportar');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `camila_s${config.semana}_t${config.turno || 'todos'}.${formato === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

// Exportar la instancia del servicio
export const camilaService = new CamilaViewsService();

// También exportar la clase por si se necesita
export default CamilaViewsService;