import axios from 'axios';
import type { OptimizationMetrics } from '../types/optimization';

const API_BASE_URL = import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL}/api/v1/`
    : 'http://localhost:8000/api/v1/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers:{'Content-Type': 'application/json'}
});

const mapResponse = (data: any): OptimizationMetrics=>{
    if(!data || !data.kpis_principales){
        throw new Error("respuesta del servidor invalida");
    }

    const detalleMov = data.kpis_principales?.movimientos?.detalle || {};

    return{
        instanciaId: data.metadata?.instancia_id || 'simulacion',
        codigo: data.metadata?.codigo || '',
        anio: data.metadata?.anio || 0,
        semana: data.metadata?.semana || 0,
        participacion: data.metadata?.participacion || 0,
        conDispersion: data.metadata?.con_dispersion || false,
        fechaInicio: data.metadata?.fecha_inicio || new Date().toISOString(),
        fechaFin: data.metadata?.fecha_fin || new Date().toISOString(),

        eficiencia: {
            real: data.kpis_principales?.eficiencia?.real || 0,
            optimizada: data.kpis_principales?.eficiencia?.optimizada || 100,
            ganancia: data.kpis_principales?.eficiencia?.ganancia || 0
        },

        metadata: data.metadata,
        
        movimientos: {
            totalReal: data.kpis_principales?.movimientos?.total_real || 0,
            yardEliminados: data.kpis_principales?.movimientos?.yard_eliminados || 0,
            optimizados: data.kpis_principales?.movimientos?.optimizados || 0,
            reduccionPorcentaje: data.kpis_principales?.movimientos?.reduccion_porcentaje || 0,
            porTipo: {
                DLVR: detalleMov.dlvr_real || 0,
                DSCH: detalleMov.dsch_real || 0,
                LOAD: detalleMov.load_real || 0,
                RECV: detalleMov.recv_real || 0,
                YARD: data.kpis_principales?.movimientos?.yard_eliminados || 0,
                OTHR: 0
            },
            optimizadosPorTipo: {
                recepcion: detalleMov.recv_real || 0,
                carga: detalleMov.load_modelo || 0,
                descarga: detalleMov.dsch_real || 0,
                entrega: detalleMov.dlvr_modelo || 0
            }
        },

        distancias: {
            totalReal: data.kpis_principales?.distancias?.total_real || 0,
            totalModelo: data.kpis_principales?.distancias?.total_modelo || 0,
            yardEliminada: data.kpis_principales?.distancias?.yard_eliminada || 0,
            load: data.kpis_principales?.distancias?.load_real || 0,
            dlvr: data.kpis_principales?.distancias?.dlvr_real || 0,
            reduccionMetros: data.kpis_principales?.distancias?.distancia_ahorrada || 0,
            reduccionPorcentaje: data.kpis_principales?.distancias?.reduccion_porcentaje || 0,
            distanciaAhorrada: data.kpis_principales?.distancias?.distancia_ahorrada || 0,
            porTipo: {
                LOAD: data.kpis_principales?.distancias?.load_real || 0,
                DLVR: data.kpis_principales?.distancias?.dlvr_real || 0,
                YARD: data.kpis_principales?.distancias?.yard_eliminada || 0
            },
            desglose: data.comparacion_resumen?.ahorro_distancia?.desglose
        },

        segregaciones: {
            total: data.kpis_principales?.segregaciones?.total || 0,
            optimizadas: data.kpis_principales?.segregaciones?.optimizadas || 0,
            porcentaje: data.kpis_principales?.segregaciones?.porcentaje || 0,
            activas: data.segregaciones_activas || []
        },

        ocupacion: {
            promedio: data.kpis_principales?.ocupacion?.promedio || 0,
            capacidadTotal: data.kpis_principales?.ocupacion?.capacidad_total || 0,
            porBloque: data.ocupacion_por_bloque?.map((bloque: any) => ({
                bloque: bloque.bloque,
                capacidad: bloque.capacidad,
                ocupacionPromedio: bloque.ocupacion_promedio,
                ocupacionMaxima: bloque.ocupacion_maxima,
                ocupacionMinima: bloque.ocupacion_minima,
                teusPromedio: bloque.teus_promedio,
                utilizacion: bloque.utilizacion,
                movimientos: bloque.movimientos || {
                    entradasGate: bloque.entradas_gate || bloque.gate_in || 0,
                    salidasGate: bloque.salidas_gate || bloque.gate_out || 0,
                    entradasMuelle: bloque.entradas_muelle || bloque.muelle_in || 0,
                    salidasMuelle: bloque.salidas_muelle || bloque.muelle_out || 0,
                    despejos: bloque.despejos || bloque.remanejos || 0
                }
            })) || []
        },

        cargaTrabajo: {
            total: data.kpis_principales?.carga_trabajo?.total || 0,
            variacion: data.kpis_principales?.carga_trabajo?.variacion || 0,
            balance: data.kpis_principales?.carga_trabajo?.balance || 0,
            maxima: data.kpis_principales?.carga_trabajo?.maxima || 0,
            minima: data.kpis_principales?.carga_trabajo?.minima || 0
        },

        evolucionTemporal: data.evolucion_temporal || [],
        comparacionResumen: data.comparacion_resumen || {},
        kpiDistanciaAhorrada: data.kpi_distancia_ahorrada
    };
};

const fetchVariantData = async(
    anio: number, 
    semana: number, 
    variant: string, 
    participacion: number, 
    dispersion: 'K' | 'N' = "K",
    criterio: number = 2,
    granularidad: string = 'bahia'
)=>{
    try{
        console.log(`api solicitando datos de ${variant} (Crit: ${criterio}, Gran: ${granularidad})`);

        const params = {
            anio,
            semana,
            participacion,
            dispersion,
            variant: variant,
            criterio,
            granularidad
        };

        const response = await api.get('/optimization/dashboard', {params});
        console.log(`datos recibidos para ${variant}`);

        return mapResponse(response.data);
    }
    catch(error:any){
        if(error.response?.status === 404){
            console.warn(`No existe instacia para ${variant}`);
            return null;
        }
        console.error(`error al llamar a la api variant`);
        throw error;
    }
};

export const pipeline = {
    async getPipeline(
        anio: number,
        semana: number,
        participacion?: number,
        dispersion?: 'K' | 'N',
        criterio: number = 2,
        granularidad: string = 'bahia'
    ): Promise<OptimizationMetrics | null>{
        return fetchVariantData(anio, semana, 'pipeline', participacion??68, dispersion??'K', criterio, granularidad);
    },

    async getEConstraint(
        anio: number,
        semana: number,
        participacion?: number,
        dispersion?: 'K' | 'N',
        criterio: number = 2,
        granularidad: string = 'bahia'
    ): Promise<OptimizationMetrics | null>{
        return fetchVariantData(anio, semana, 'e-constraint', participacion??68, dispersion??'K', criterio, granularidad);
    }
};