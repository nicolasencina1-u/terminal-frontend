// src/services/simulationApi.ts
import axios from 'axios';

const SIMULATION_API_URL = import.meta.env.VITE_SIMULATION_API_URL || 'http://localhost:8080';

const simulationApi = axios.create({
    baseURL: SIMULATION_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface SimulationRequest {
    anio: number;
    participacion: number;
    criterio: string;
    semanas: string[];
    variant: string;
    granularidad: string;
    usar_db: boolean;
    cargar_resultados: boolean;
}

export interface SimulationResponse {
    id_tarea: string;
    estado: string;
    mensaje: string;
}

export interface TaskStatus {
    id_tarea: string;
    estado: 'pendiente' | 'ejecutando' | 'cargando_bd' | 'completado' | 'error';
    progreso: number;
    mensaje: string;
    resultado?: any;
    error?: string;
    fecha_inicio: string;
    fecha_fin?: string;
    datos_cargados?: any;
    detalles_progreso?: {
        etapa: string;
        parametros?: any;
    };
    tiempo_transcurrido: string;
    tiempo_estimado?: string;
}

// Función helper para generar semanas ISO
function getISOWeeksForYear(year: number): string[] {
    const weeks: string[] = [];
    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay() || 7; // Si es domingo (0), convertir a 7

    // Encontrar el primer lunes
    let firstMonday = new Date(jan1);
    if (jan1Day !== 1) {
        if (jan1Day <= 4) {
            // Si el 1 de enero es lun-jue, retroceder al lunes
            firstMonday.setDate(jan1.getDate() - (jan1Day - 1));
        } else {
            // Si el 1 de enero es vie-dom, avanzar al siguiente lunes
            firstMonday.setDate(jan1.getDate() + (8 - jan1Day));
        }
    }

    // Generar todas las semanas del año
    const currentDate = new Date(firstMonday);
    while (currentDate.getFullYear() === year || (currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0 && currentDate.getDate() < 4)) {
        weeks.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 7);

        // Verificar si la siguiente semana ya es del año siguiente
        if (currentDate.getFullYear() > year && currentDate.getMonth() > 0) {
            break;
        }
    }

    return weeks;
}

export const simulationService = {
    // Obtener semanas ISO para un año
    getISOWeeksForYear,

    // Iniciar simulación con múltiples semanas
    async startSimulation(config: {
        anio: number;
        participacion: number;
        semanas: string[]; // Array de fechas ISO
        criterio?: string;
        variant: string;
    }): Promise<SimulationResponse> {
        const request: SimulationRequest = {
            anio: config.anio,
            participacion: config.participacion,
            criterio: config.criterio || "criterioII",
            semanas: config.semanas,
            variant: config.variant,
            usar_db: true,
            cargar_resultados: true
        };

        const response = await simulationApi.post('/optimizar', request);
        return response.data;
    },

    // Obtener estado de tarea
    async getTaskStatus(taskId: string): Promise<TaskStatus> {
        const response = await simulationApi.get(`/tarea/${taskId}`);
        return response.data;
    },

    // Obtener progreso simplificado
    async getTaskProgress(taskId: string): Promise<{
        progreso: number;
        mensaje: string;
        estado: string;
        tiempo_transcurrido: string;
        tiempo_estimado: string;
        etapa_actual: string;
    }> {
        const response = await simulationApi.get(`/tarea/${taskId}/progreso`);
        return response.data;
    },

    // Listar todas las tareas
    async getAllTasks(): Promise<{
        tareas: any[];
        total: number;
        en_progreso: number;
    }> {
        const response = await simulationApi.get('/tareas');
        return response.data;
    },

    // Cargar datos sin optimizar
    async loadDataOnly(config: {
        anio: number;
        participacion: number;
        semanas: string[];
    }): Promise<any> {
        const response = await simulationApi.post('/cargar-bd', config);
        return response.data;
    }
};