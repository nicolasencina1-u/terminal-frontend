// src/components/map/views/patio/PatioHeader.tsx
import React from 'react';
import { Database, RefreshCw, Activity, TrendingUp } from 'lucide-react';
import type { PatioData } from '../../../../types';
import type { CamilaDashboardData } from '../../../../types/camila';
import type { OptimizationMetrics } from '../../../../types/optimization';

interface PatioHeaderProps {
    patio: PatioData;
    isCamilaActive: boolean;
    isOptimizationActive: boolean;
    activeModelName: string;
    timeState: any;
    currentPeriod: number;
    currentTurno: number;
    camilaData?: CamilaDashboardData | null;
    optimizationMetrics?: OptimizationMetrics | null;
    onRefresh: () => void;
}

export const PatioHeader: React.FC<PatioHeaderProps> = ({
    patio,
    isCamilaActive,
    isOptimizationActive,
    activeModelName = 'Magdalena',
    timeState,
    currentPeriod,
    currentTurno,
    camilaData,
    optimizationMetrics,
    onRefresh
}) => {
    let ocupacionActual = patio.ocupacionTotal;
    let metricaLabel = 'Ocupación Total';

    if (isCamilaActive && camilaData?.resultado) {
        ocupacionActual = camilaData.resultado.utilizacion_modelo;
        metricaLabel = 'Utilización Modelo';
    } else if (isOptimizationActive && optimizationMetrics) {
        const turnoData = optimizationMetrics.evolucionTemporal?.find(
            t => t.periodo === currentTurno
        );
        ocupacionActual = turnoData?.ocupacionPromedio || optimizationMetrics.ocupacion?.promedio || 0;
        metricaLabel = `Ocupación Turno ${currentTurno}`;
    }

    return (
        <div className="mb-4 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-100 flex items-center flex-wrap gap-2">
                        {patio.name}
                        {isCamilaActive && (
                            <span className="px-3 py-1 bg-teal-950/30 text-teal-300 rounded-full text-sm font-medium border border-teal-800 flex items-center">
                                <Activity size={14} className="mr-1" />
                                Camila - Período {currentPeriod}
                            </span>
                        )}
                        {isOptimizationActive && (
                            <span className="px-3 py-1 bg-cyan-950/30 text-cyan-300 rounded-full text-sm font-medium border border-cyan-800 flex items-center capitalize">
                                <TrendingUp size={14} className="mr-1" />
                                {(() => {
                                    const name = activeModelName || '';
                                    if (name.toLowerCase() === 'e-constraint') return 'E-Constraint';
                                    return name.charAt(0).toUpperCase() + name.slice(1);
                                })()} - Turno {currentTurno}/21
                            </span>
                        )}
                        {timeState?.dataSource === 'historical' && (
                            <span className="px-3 py-1 bg-blue-950/30 text-blue-300 rounded-full text-sm font-medium border border-blue-800 flex items-center">
                                <Database size={14} className="mr-1" />
                                Datos Históricos
                            </span>
                        )}
                    </h2>
                    <p className="text-slate-400 mt-1">
                        {isOptimizationActive && optimizationMetrics ?
                            `${optimizationMetrics.anio} - Semana ${optimizationMetrics.semana} - Participación ${optimizationMetrics.participacion}% ${optimizationMetrics.conDispersion ? 'con' : 'sin'} dispersión` :
                            patio.description
                        }
                    </p>
                </div>
                <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-blue-400">
                        {ocupacionActual.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-500">
                        {metricaLabel}
                    </div>
                    {isOptimizationActive && optimizationMetrics && (
                        <div className="text-xs text-slate-600 mt-1">
                            Promedio: {optimizationMetrics.ocupacion?.promedio.toFixed(1)}%
                        </div>
                    )}
                </div>
            </div>

            {timeState?.dataSource === 'historical' && (
                <div className="flex justify-end mt-3 pt-3 border-t border-slate-700">
                    <button onClick={onRefresh} className="px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors flex items-center text-sm">
                        <RefreshCw size={14} className="mr-1" />
                        Actualizar
                    </button>
                </div>
            )}
        </div>
    );
};