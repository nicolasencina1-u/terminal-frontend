// src/components/map/views/patio/PatioGrid.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BloqueComponent } from './BloqueComponent';
import { getCamilaDataForBlock, getOptimizationModelDataForBlock } from './patioDataHelpers';
import type { PatioData } from '../../../../types';
import type { CamilaDashboardData } from '../../../../types/camila';
import type { OptimizationMetrics } from '../../../../types/optimization';
import type { BloqueDataExtended } from '../../../../types/patioView.types';
import type { comparisonSource } from './patioDataHelpers';

interface PatioGridProps {
    patio: PatioData;
    selectedBloque: string | null;
    isCamilaActive: boolean;
    isOptimizationActive: boolean;
    activeModelName: string;
    currentPeriod: number;
    currentTurno: number;
    camilaData?: CamilaDashboardData | null;
    optimizationMetrics?: OptimizationMetrics | null;
    timeState: any;
    getColorForOcupacion: (value: number) => string;
    onBloqueSelect: (bloqueId: string) => void;
    referenceMetrics?: OptimizationMetrics | null;
    comparisonType?: comparisonSource;
    isComparisonEnabled?: boolean;
}

export const PatioGrid: React.FC<PatioGridProps> = ({
    patio,
    selectedBloque,
    isCamilaActive,
    isOptimizationActive,
    activeModelName = 'Magdalena',
    currentPeriod,
    currentTurno,
    camilaData,
    optimizationMetrics,
    timeState,
    getColorForOcupacion,
    onBloqueSelect,
    referenceMetrics,
    comparisonType = 'historico',
    isComparisonEnabled = false
}) => {
    return (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                Bloques del Patio
                {isCamilaActive && (
                    <span className="ml-2 text-sm font-normal text-teal-400">
                        (Asignación de grúas RTG - Período {currentPeriod})
                    </span>
                )}
                {isOptimizationActive && (
                    <span className="ml-2 text-sm font-normal text-cyan-400 capitalize">
                        (Optimización de espacios - Turno {currentTurno})
                    </span>
                )}
                {timeState?.dataSource === 'historical' && (
                    <span className="ml-2 text-sm font-normal text-blue-400">
                        (Datos del {timeState.currentDate.toLocaleDateString('es-CL')})
                    </span>
                )}
            </h3>

            {patio.bloques.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                    <AlertTriangle size={32} className="mx-auto mb-2" />
                    <p>No hay bloques con datos para este período</p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {patio.bloques.map((bloque) => {
                    const bloqueExtended = bloque as BloqueDataExtended;
                    const camilaBlockData = isCamilaActive && camilaData ?
                        getCamilaDataForBlock(bloque.id, camilaData, currentPeriod) : undefined;
                    
                    // Calcular datos de optimización si el modelo está activo O si hay una comparación activa en modo histórico
                    const isComparisonActive = isComparisonEnabled && comparisonType !== 'historico' && !!referenceMetrics;
                    const shouldShowOptData = (isOptimizationActive && optimizationMetrics) || 
                                           (!isOptimizationActive && isComparisonActive);

                    const optBlockData = shouldShowOptData ?
                        getOptimizationModelDataForBlock(
                            bloque.id, 
                            isOptimizationActive ? optimizationMetrics : referenceMetrics, 
                            currentTurno, 
                            isOptimizationActive ? referenceMetrics : null, 
                            comparisonType
                        ) : undefined;

                    return (
                        <BloqueComponent
                            key={`${bloque.id}-${comparisonType}-${isOptimizationActive}-${isComparisonEnabled}`}
                            bloque={bloqueExtended}
                            isSelected={selectedBloque === bloque.id}
                            onClick={() => onBloqueSelect(bloque.id)}
                            getColorForOcupacion={getColorForOcupacion}
                            isOptimizationActive={isOptimizationActive}
                            isCamilaActive={isCamilaActive}
                            ocupacionTurno={bloque.ocupacion}
                            currentPeriod={currentPeriod}
                            dashboardData={camilaData ?? undefined}
                            optimizationModelData={optBlockData ?? (bloque as any).optimizationModelData}
                            activeModelName={isOptimizationActive ? activeModelName : (isComparisonActive ? (comparisonType || '') : 'Magdalena')}
                            isComparisonEnabled={isComparisonEnabled}
                        />
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 mt-4 border-t border-slate-700 space-y-2 sm:space-y-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
                    {isCamilaActive ? (
                        <>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-500 rounded mr-1.5"></div><span>Baja (&lt;50%)</span></div>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-yellow-500 rounded mr-1.5"></div><span>Media (50-80%)</span></div>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-500 rounded mr-1.5"></div><span>Alta (&gt;80%)</span></div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-green-500 rounded mr-1.5"></div><span>Bajo (&lt;70%)</span></div>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-yellow-500 rounded mr-1.5"></div><span>Medio (70-85%)</span></div>
                            <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-500 rounded mr-1.5"></div><span>Alto (&gt;85%)</span></div>
                        </>
                    )}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">Clic en bloque para vista micro</div>
            </div>
        </div>
    );
};
