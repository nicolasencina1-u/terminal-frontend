// src/components/ModelSelector.tsx
import React, { useEffect, useState } from 'react';
import { useOptimizationModelContext } from '../../contexts/OptimizationModelContext';
import { useAvailableConfigurations } from '../../hooks/useAvailableConfigurations';
import { simulationService } from '../../services/simulationApi';
import { SimulationModal } from './SimulationModal';
import type { OptimizationConfig, AvailableConfiguration, SimulationState } from '../../types/optimization';
import {
    Calendar,
    Package,
    Activity,
    AlertCircle,
    Play,
    Loader,
    CheckCircle,
    XCircle,
    Settings,
    RefreshCw
} from 'lucide-react';

export const ModelSelector: React.FC = () => {
    const { config, updateConfig } = useOptimizationModelContext();
    const { configurations, isLoading, error, refetch } = useAvailableConfigurations(config.variant);

    const [simulation, setSimulation] = useState<SimulationState>({
        isRunning: false,
        progress: 0,
        status: 'idle'
    });

    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Obtener valores únicos de las configuraciones disponibles
    const availableYears = [...new Set(configurations.map((c: AvailableConfiguration) => c.anio))].sort();
    const availableWeeks = [...new Set(
        configurations
            .filter((c: AvailableConfiguration) => c.anio === config.anio)
            .map((c: AvailableConfiguration) => c.semana)
    )].sort((a: number, b: number) => a - b);
    const availableParticipations = [...new Set(
        configurations
            .filter((c: AvailableConfiguration) => c.anio === config.anio && c.semana === config.semana)
            .map((c: AvailableConfiguration) => c.participacion)
    )].sort((a: number, b: number) => a - b);

    const handleConfigUpdate = (updates: Partial<OptimizationConfig>) => {
        const newConfig = { ...config, ...updates };

        // Validar que la semana existe para el año seleccionado
        if (updates.anio) {
            const weeksForYear = configurations
                .filter((c: AvailableConfiguration) => c.anio === newConfig.anio)
                .map((c: AvailableConfiguration) => c.semana);
            if (weeksForYear.length > 0 && !weeksForYear.includes(newConfig.semana)) {
                newConfig.semana = Math.min(...weeksForYear);
            }
        }

        // Validar que la participación existe
        if (updates.anio || updates.semana) {
            const participationsAvailable = configurations
                .filter((c: AvailableConfiguration) => c.anio === newConfig.anio && c.semana === newConfig.semana)
                .map((c: AvailableConfiguration) => c.participacion);
            if (participationsAvailable.length > 0 && !participationsAvailable.includes(newConfig.participacion)) {
                newConfig.participacion = participationsAvailable[0];
            }
        }

        updateConfig(newConfig);
    };

    // Función para refrescar configuraciones
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            // Pequeño delay para feedback visual
            setTimeout(() => {
                setIsRefreshing(false);
            }, 500);
        } catch (error) {
            console.error('Error refreshing configurations:', error);
            setIsRefreshing(false);
        }
    };

    // Función para iniciar la simulación
    const startSimulation = async (simulationConfig: any) => {
        try {
            setShowSimulationModal(false);
            setSimulation({
                isRunning: true,
                progress: 0,
                status: 'running',
                message: `Iniciando simulación de ${simulationConfig.semanas.length} semana(s)...`
            });

            // Iniciar simulación
            const response = await simulationService.startSimulation(simulationConfig);

            setSimulation(prev => ({
                ...prev,
                taskId: response.id_tarea,
                message: response.mensaje
            }));

            // Iniciar monitoreo de progreso
            const interval = setInterval(async () => {
                try {
                    const status = await simulationService.getTaskStatus(response.id_tarea);

                    setSimulation(prev => ({
                        ...prev,
                        progress: status.progreso,
                        message: status.mensaje,
                        status: status.estado === 'completado' ? 'completed' :
                            status.estado === 'error' ? 'error' : 'running',
                        error: status.error,
                        result: status.resultado
                    }));

                    // Si terminó, limpiar intervalo y refrescar
                    if (status.estado === 'completado' || status.estado === 'error') {
                        clearInterval(interval);
                        setProgressInterval(null);

                        // Si completó exitosamente, refrescar configuraciones automáticamente
                        if (status.estado === 'completado') {
                            console.log('Simulación completada, refrescando configuraciones...');
                            setTimeout(() => {
                                handleRefresh();
                            }, 1000);
                        }
                    }
                } catch (error) {
                    console.error('Error checking progress:', error);
                }
            }, 2000); // Actualizar cada 2 segundos

            setProgressInterval(interval);

        } catch (error: any) {
            setSimulation({
                isRunning: false,
                progress: 0,
                status: 'error',
                error: error.message || 'Error al iniciar simulación'
            });
        }
    };

    // Limpiar intervalo al desmontar
    useEffect(() => {
        return () => {
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        };
    }, [progressInterval]);

    // Auto-reset simulation state después de completar
    useEffect(() => {
        if (simulation.status === 'completed') {
            const timer = setTimeout(() => {
                setSimulation({
                    isRunning: false,
                    progress: 0,
                    status: 'idle'
                });
            }, 10000); // Reset después de 10 segundos

            return () => clearTimeout(timer);
        }
    }, [simulation.status]);

    const hasDataForCurrentConfig = configurations.some(
        (c: AvailableConfiguration) =>
            c.anio === config.anio &&
            c.semana === config.semana &&
            c.participacion === config.participacion &&
            c.dispersion === 'K' // Solo con dispersión
    );

    if (isLoading && !isRefreshing) {
        return (
            <div className="space-y-3">
                <div className="text-sm font-medium text-slate-50">
                    Configuración del Modelo
                </div>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-slate-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error && !isRefreshing) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-50">
                        Configuración del Modelo
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Reintentar"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                <div className="bg-red-950/30 border border-red-700 rounded p-3">
                    <div className="flex items-center text-red-400">
                        <AlertCircle size={16} className="mr-2" />
                        <span className="text-sm">Error cargando configuraciones</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-50">
                        Configuración del Modelo
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing || simulation.isRunning}
                        className={`text-slate-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''
                            } ${(isRefreshing || simulation.isRunning) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Refrescar configuraciones"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Año */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex items-center">
                        <Calendar size={12} className="mr-1" />
                        Año
                    </label>
                    <select
                        value={config.anio}
                        onChange={(e) => handleConfigUpdate({ anio: Number(e.target.value) })}
                        className="w-full text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        disabled={availableYears.length === 0 || simulation.isRunning || isRefreshing}
                    >
                        {availableYears.map((year: number) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Semana */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block">
                        Semana {config.semana}
                    </label>
                    <input
                        type="range"
                        min={Math.min(...availableWeeks) || 1}
                        max={Math.max(...availableWeeks) || 52}
                        value={config.semana}
                        onChange={(e) => handleConfigUpdate({ semana: Number(e.target.value) })}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((config.semana - (Math.min(...availableWeeks) || 1)) /
                                ((Math.max(...availableWeeks) || 52) - (Math.min(...availableWeeks) || 1))) * 100
                                }%, #334155 ${((config.semana - (Math.min(...availableWeeks) || 1)) /
                                    ((Math.max(...availableWeeks) || 52) - (Math.min(...availableWeeks) || 1))) * 100
                                }%, #334155 100%)`
                        }}
                        disabled={availableWeeks.length === 0 || simulation.isRunning || isRefreshing}
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>{Math.min(...availableWeeks) || 1}</span>
                        <span>{Math.max(...availableWeeks) || 52}</span>
                    </div>
                </div>

                {/* Participación */}
                <div>
                    <label className="text-xs text-slate-400 mb-1 block flex items-center">
                        <Package size={12} className="mr-1" />
                        Participación
                    </label>
                    <select
                        value={config.participacion}
                        onChange={(e) => handleConfigUpdate({ participacion: Number(e.target.value) })}
                        className="w-full text-sm bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        disabled={availableParticipations.length === 0 || simulation.isRunning || isRefreshing}
                    >
                        {availableParticipations.map((part: number) => (
                            <option key={part} value={part}>{part}%</option>
                        ))}
                    </select>
                </div>

                {/* Botón de simulación avanzada */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <button
                        onClick={() => setShowSimulationModal(true)}
                        disabled={simulation.isRunning || isRefreshing}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition-colors ${!simulation.isRunning && !isRefreshing
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {simulation.isRunning ? (
                            <Loader className="animate-spin mr-2" size={16} />
                        ) : (
                            <Settings className="mr-2" size={16} />
                        )}
                        {simulation.isRunning ? 'Simulación en progreso...' : 'Configurar Simulación'}
                    </button>

                    {/* Progreso de simulación */}
                    {simulation.status !== 'idle' && (
                        <div className="mt-3 space-y-2">
                            {/* Barra de progreso */}
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-full rounded-full transition-all duration-300 ${simulation.status === 'error' ? 'bg-red-500' :
                                            simulation.status === 'completed' ? 'bg-green-500' :
                                                'bg-cyan-500'
                                        }`}
                                    style={{ width: `${simulation.progress}%` }}
                                />
                            </div>

                            {/* Estado y mensaje */}
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                    {simulation.status === 'running' && (
                                        <Loader className="animate-spin mr-1" size={12} />
                                    )}
                                    {simulation.status === 'completed' && (
                                        <CheckCircle className="text-green-500 mr-1" size={12} />
                                    )}
                                    {simulation.status === 'error' && (
                                        <XCircle className="text-red-500 mr-1" size={12} />
                                    )}
                                    <span className={
                                        simulation.status === 'error' ? 'text-red-400' :
                                            simulation.status === 'completed' ? 'text-green-400' :
                                                'text-slate-400'
                                    }>
                                        {simulation.message || 'Procesando...'}
                                    </span>
                                </div>
                                <span className="text-slate-500">
                                    {simulation.progress}%
                                </span>
                            </div>

                            {/* Error detallado */}
                            {simulation.error && (
                                <div className="mt-2 p-2 bg-red-950/30 border border-red-700 rounded text-xs text-red-400">
                                    {simulation.error}
                                </div>
                            )}

                            {/* Resultado exitoso */}
                            {simulation.status === 'completed' && simulation.result && (
                                <div className="mt-2 p-2 bg-green-950/30 border border-green-700 rounded text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="text-green-400">
                                            <div>✓ Simulación completada</div>
                                            <div>Semanas procesadas: {simulation.result.semanas_ok || 0}</div>
                                            {simulation.result.datos_cargados && (
                                                <div>Datos cargados en BD</div>
                                            )}
                                        </div>
                                        {!isRefreshing && (
                                            <button
                                                onClick={handleRefresh}
                                                className="text-green-400 hover:text-green-300 transition-colors p-1"
                                                title="Refrescar configuraciones"
                                            >
                                                <RefreshCw size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {isRefreshing && (
                                        <div className="mt-2 text-green-300 text-xs flex items-center">
                                            <Loader className="animate-spin mr-1" size={12} />
                                            Actualizando configuraciones...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Información de disponibilidad */}
                <div className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded p-2">
                    <div className="font-medium mb-1 text-slate-300 flex items-center">
                        <Activity size={12} className="mr-1" />
                        Disponibilidad de Datos
                    </div>
                    <div className="space-y-1">
                        <div>{configurations.length} instancias disponibles</div>
                        <div>{availableYears.length} años ({availableYears[0]} - {availableYears[availableYears.length - 1]})</div>
                        <div className="flex items-center mt-1">
                            <div className={`w-2 h-2 rounded-full mr-1 ${hasDataForCurrentConfig ? 'bg-green-500' : 'bg-orange-500'
                                }`}></div>
                            <span>{hasDataForCurrentConfig ? 'Datos disponibles' : 'Requiere simulación'}</span>
                        </div>
                    </div>
                </div>

                {/* Resumen de la configuración actual */}
                {hasDataForCurrentConfig && configurations.length > 0 && (
                    <div className="text-xs bg-cyan-950/30 border border-cyan-700 rounded p-2">
                        {(() => {
                            const configData = configurations.find(
                                (c: AvailableConfiguration) =>
                                    c.anio === config.anio &&
                                    c.semana === config.semana &&
                                    c.participacion === config.participacion &&
                                    c.dispersion === 'K'
                            );
                            return configData ? (
                                <>
                                    <div className="font-medium text-cyan-300 mb-1">Instancia Seleccionada</div>
                                    <div className="text-cyan-200">
                                        {configData.totalMovimientos.toLocaleString()} movimientos
                                    </div>
                                    <div className="text-cyan-200">
                                        {configData.totalSegregaciones} segregaciones
                                    </div>
                                    <div className="text-cyan-200 text-xs mt-1">
                                        {new Date(configData.fechaInicio).toLocaleDateString()} - {new Date(configData.fechaFin).toLocaleDateString()}
                                    </div>
                                </>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>

            {/* Modal de simulación */}
            <SimulationModal
                isOpen={showSimulationModal}
                onClose={() => setShowSimulationModal(false)}
                onStart={startSimulation}
                defaultAnio={config.anio}
                defaultParticipacion={config.participacion}
            />
        </>
    );
};

export default ModelSelector;