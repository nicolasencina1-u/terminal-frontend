// src/components/shared/DataSourceSelector.tsx
import React, { useEffect } from 'react';
import { useTimeContext } from '../../contexts/TimeContext';
import { useOptimizationModelContext } from '../../contexts/OptimizationModelContext';
import { Database, BarChart3, Activity } from 'lucide-react';
import { ModelSelector } from '../optimization/ModelSelector';
import ModelConfigSelector from '../camila/selectors/ModelConfigSelector';

export const DataSourceSelector: React.FC = () => {
    const { timeState, setDataSource, setCamilaConfig, isLoadingData } = useTimeContext();
    
    // Obtenemos los controladores del nuevo Contexto de Modelos
    const { setActiveModel, updateConfig } = useOptimizationModelContext();

    useEffect(() => {
        if (timeState?.dataSource === 'historical') {
            const timer = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('force-historical-reload'));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [timeState?.dataSource]);

    const dataSources = [
        { id: 'historical' as const, name: 'Datos Históricos', icon: <Database size={16} />, description: 'Información real del puerto', color: 'blue' },
        { id: 'magdalena' as const, name: 'Modelo Magdalena', icon: <BarChart3 size={16} />, description: 'Optimización de espacios', color: 'green' },
        { id: 'pipeline' as const, name: 'Modelo Pipeline', icon: <BarChart3 size={16} />, description: 'Optimización secuencial', color: 'green' },
        { id: 'e-constraint' as const, name: 'Modelo E-Constraint', icon: <BarChart3 size={16} />, description: 'Optimización conjunta', color: 'green' }
    ];

    const handleSourceSelect = (sourceId: string) => {
        setDataSource(sourceId);

        if (sourceId === 'historical') {
            setActiveModel('historical');
        } else if (sourceId === 'magdalena') {
            setActiveModel('magdalena');
            updateConfig({ variant: 'magdalena' });
        } else if (sourceId === 'pipeline') {
            setActiveModel('pipeline');
            updateConfig({ variant: 'pipeline' });
        } else if (sourceId === 'e-constraint') {
            setActiveModel('e-constraint');
            updateConfig({ variant: 'e-constraint' });
        }
    };

    const getButtonClass = (sourceId: string, color: string) => {
        const isActive = timeState?.dataSource === sourceId;
        const baseClass = 'w-full text-left p-2 rounded-lg transition-all duration-200 border';
        if (isActive) {
            switch (color) {
                case 'blue': return `${baseClass} bg-blue-950/30 border-blue-700 text-blue-300`;
                case 'green': return `${baseClass} bg-green-950/30 border-green-700 text-green-300`;
                case 'teal': return `${baseClass} bg-teal-950/30 border-teal-700 text-teal-300`;
                default: return `${baseClass} bg-slate-700 border-slate-600 text-slate-300`;
            }
        }
        return `${baseClass} bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-slate-300`;
    };

    const getIconColor = (color: string, isActive: boolean) => {
        if (!isActive) return 'text-slate-500';
        switch (color) {
            case 'blue': return 'text-blue-400';
            case 'green': return 'text-green-400';
            case 'teal': return 'text-teal-400';
            default: return 'text-slate-400';
        }
    };

    const getDotColor = (color: string) => {
        switch (color) {
            case 'blue': return 'bg-blue-500';
            case 'green': return 'bg-green-500';
            case 'teal': return 'bg-teal-500';
            default: return 'bg-slate-500';
        }
    };

    // Verificar si alguna variante de modelo está activa para mostrar el selector de configuración
    const isAnyModelActive = ['magdalena', 'pipeline', 'e-constraint'].includes(timeState?.dataSource);

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-slate-200">
                Fuente de Datos
            </div>

            <div className="space-y-2">
                {dataSources.map((source) => {
                    const isActive = timeState?.dataSource === source.id;
                    return (
                        <button
                            key={source.id}
                            onClick={() => handleSourceSelect(source.id)}
                            disabled={isLoadingData}
                            className={getButtonClass(source.id, source.color)}
                        >
                            <div className="flex items-center space-x-2">
                                <div className={`flex-shrink-0 ${getIconColor(source.color, isActive)}`}>
                                    {source.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{source.name}</div>
                                    <div className="text-xs text-slate-500 truncate">{source.description}</div>
                                </div>
                                {isActive && (
                                    <div className={`w-2 h-2 rounded-full ${getDotColor(source.color)}`}></div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Muestra el selector de configuración para CUALQUIER modelo seleccionado */}
            {isAnyModelActive && (
                <div className="mt-4 pt-3 border-t border-slate-700">
                    <ModelSelector />
                </div>
            )}

            <div className="text-xs text-slate-500 text-center pt-2">
                {isLoadingData ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-cyan-400 mr-2"></div>
                        Cargando...
                    </div>
                ) : (
                    <span>
                        Fuente activa: <strong className="text-slate-300">{dataSources.find(s => s.id === timeState?.dataSource)?.name}</strong>
                    </span>
                )}
            </div>
        </div>
    );
};