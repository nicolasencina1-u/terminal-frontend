// src/components/map/views/patio/BloqueComponent.tsx
import React from 'react';
import { Truck, Layers, BarChart3, TrendingUp, TrendingDown, ArrowRight, Package } from 'lucide-react';
import type { BloqueComponentProps, BloqueStats } from '../../../../types/patioView.types';

export const BloqueComponent: React.FC<BloqueComponentProps & { 
    isOptimizationActive?: boolean; 
    optimizationModelData?: any; 
    activeModelName?: string;
    referenceMetrics?: any;
    comparisonType?: string;
    isComparisonEnabled?: boolean;
}> = ({
    bloque,
    isSelected,
    onClick,
    getColorForOcupacion,
    isOptimizationActive,
    isCamilaActive,
    ocupacionTurno,
    camilaData,
    currentPeriod = 1,
    dashboardData,
    optimizationModelData,
    activeModelName = 'Magdalena',
    referenceMetrics,
    comparisonType,
    isComparisonEnabled
}) => {
    // IMPORTANTE: En modo histórico, processPatioData inyecta los datos de comparación dentro del objeto bloque
    // Pero si estamos en modo optimización, usamos la prop directa optimizationModelData
    const optData = optimizationModelData || (bloque as any).optimizationModelData;
    const hasComparisonData = !!optData && isComparisonEnabled;

    let ocupacionActual = bloque.ocupacion;
    let totalMovimientosPeriodo = 0;
    let gruasAsignadas: number[] = [];

    if (isCamilaActive && camilaData) {
        totalMovimientosPeriodo = camilaData.asignaciones.reduce((sum: number, a: any) => sum + a.movimientos_asignados, 0);
        gruasAsignadas = camilaData.gruas;

        if (totalMovimientosPeriodo > 0 && dashboardData) {
            const utilizacionPromedio = camilaData.metricas?.reduce((sum: number, m: any) => sum + m.utilizacion_pct, 0) || 0;
            const numGruas = camilaData.metricas?.length || 1;
            ocupacionActual = Math.round(utilizacionPromedio / numGruas);
        } else {
            ocupacionActual = 0;
        }
    } else if (isOptimizationActive && optData) {
        // Solo sobreescribir ocupación principal si el modo optimización está ACTIVO
        ocupacionActual = optData.ocupacionTurno !== undefined ? optData.ocupacionTurno : ocupacionActual;
    }

    const color = bloque.operationalStatus === 'maintenance'
        ? '#6B7280'
        : bloque.operationalStatus === 'restricted'
            ? '#EF4444'
            : isCamilaActive
                ? (ocupacionActual > 80 ? '#EF4444' : ocupacionActual > 50 ? '#F59E0B' : '#10B981')
                : getColorForOcupacion(ocupacionActual);

    const ocupiedSlots = Math.round(bloque.capacidadTotal * ocupacionActual / 100);

    const calcReduction = (historical: number, optimized: number) => {
        if (historical === 0) return 0;
        return Math.round(((historical - optimized) / historical) * 100);
    };

    const formatModelName = (name: string) => {
        if (!name) return '';
        const n = name.toLowerCase();
        if (n === 'e-constraint' || n === 'econstraint') return 'E-Constraint';
        if (n === 'historico' || n === 'historical') return 'Datos Históricos';
        return name.charAt(0).toUpperCase() + name.slice(1);
    };
    const activeModelFormatted = formatModelName(activeModelName);

    // Determinar qué valores mostrar en la comparación
    const getComparisonDisplay = () => {
        if (!hasComparisonData) return null;

        if (isOptimizationActive) {
            // Caso 1: Estamos en un MODELO, comparamos contra HISTÓRICO (u otro modelo)
            // Mostramos: [Histórico/Ref] -> [Modelo Activo]
            return {
                base: optData.historico?.ocupacion || 0,
                target: ocupacionActual,
                mejora: optData.comparacion?.ocupacionMejora || 0,
                label: formatModelName(optData.comparacion?.comparedAgainst || 'historico')
            };
        } else {
            // Caso 2: Estamos en HISTÓRICO, comparamos contra un MODELO
            // Mostramos: [Histórico Activo] -> [Modelo Ref]
            return {
                base: ocupacionActual,
                target: optData.ocupacionTurno || 0,
                mejora: - (optData.comparacion?.ocupacionMejora || 0), // Invertir signo si es necesario
                label: activeModelFormatted
            };
        }
    };

    const comparison = getComparisonDisplay();

    return (
        <div
            className={`relative bg-slate-900 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-lg ${isSelected ? 'border-cyan-500 shadow-xl scale-105' : 'border-slate-700 hover:border-slate-600'
                } ${bloque.operationalStatus === 'maintenance' ? 'opacity-75' : ''}`}
            onClick={onClick}
            style={{ minHeight: hasComparisonData ? '350px' : '260px' }}
        >
            <div className="absolute top-2 right-2">
                <div
                    className="w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: ocupacionActual > 80 ? '#ef4444' :
                            ocupacionActual > 60 ? '#f59e0b' : '#10b981'
                    }}
                />
            </div>

            <div className="p-3 pb-2 border-b border-slate-700">
                <h4 className="font-bold text-base text-white">{bloque.id}</h4>
                <p className="text-xs text-slate-400">Bloque {bloque.id}</p>
            </div>

            <div className="p-3 space-y-2">
                {isCamilaActive && camilaData ? (
                    <>
                        {/* Bloque Camila */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-slate-300">Mov. P{currentPeriod}</span>
                                <span className="text-sm font-bold text-teal-300">{totalMovimientosPeriodo}</span>
                            </div>
                            {totalMovimientosPeriodo > 0 && (
                                <div className="w-full bg-slate-700 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-300 bg-teal-500"
                                        style={{ width: `${Math.min(100, (totalMovimientosPeriodo / 30) * 100)}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (isOptimizationActive || hasComparisonData) ? (
                    <>
                        {/* Vista Unificada de Modelos (Magdalena, Pipeline, etc) */}
                        <div className="pb-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs text-slate-400">Ocupación</span>
                                <div className="flex items-center gap-2">
                                    {comparison && (
                                        <>
                                            <span className="text-xs text-slate-500">
                                                {Math.floor(comparison.base)}%
                                            </span>
                                            <ArrowRight size={12} className="text-slate-600" />
                                        </>
                                    )}
                                    <span className="text-xl font-bold" style={{ color }}>
                                        {Math.floor(isOptimizationActive ? ocupacionActual : (comparison?.base || ocupacionActual))}%
                                    </span>
                                    {comparison && isOptimizationActive && (
                                        <span className={`text-xs ${comparison.mejora > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                                            ({comparison.mejora > 0 ? '-' : ''}{Math.abs(Math.round(comparison.mejora))}%)
                                        </span>
                                    )}
                                    {comparison && !isOptimizationActive && (
                                        <span className="text-xs text-purple-400 font-semibold">
                                            → {Math.floor(comparison.target)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-slate-700">
                            <span className="text-xs text-slate-400">Capacidad:</span>
                            <span className="text-xs font-medium text-white">
                                {ocupiedSlots}/{bloque.capacidadTotal}
                            </span>
                        </div>

                        {/* Detalle de movimientos con comparación */}
                        <div className="py-1.5 border-b border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Gate:</div>
                            <div className="pl-2 space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Entradas:</span>
                                    <div className="flex items-center gap-1">
                                        {isOptimizationActive && hasComparisonData && optData.historico ? (
                                            <>
                                                <span className="text-xs text-slate-500">{optData.historico.gateEntradas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-green-400">{optData.movimientosRecepcion}</span>
                                            </>
                                        ) : !isOptimizationActive && hasComparisonData ? (
                                            <>
                                                <span className="text-xs text-green-400">↓ {bloque.stats?.gateEntradas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-purple-400">{optData.movimientosRecepcion}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-medium text-green-400">↓ {isOptimizationActive ? optData.movimientosRecepcion : bloque.stats?.gateEntradas}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Salidas:</span>
                                    <div className="flex items-center gap-1">
                                        {isOptimizationActive && hasComparisonData && optData.historico ? (
                                            <>
                                                <span className="text-xs text-slate-500">{optData.historico.gateSalidas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-blue-400">{optData.movimientosEntrega}</span>
                                            </>
                                        ) : !isOptimizationActive && hasComparisonData ? (
                                            <>
                                                <span className="text-xs text-blue-400">↑ {bloque.stats?.gateSalidas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-purple-400">{optData.movimientosEntrega}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-medium text-blue-400">↑ {isOptimizationActive ? optData.movimientosEntrega : bloque.stats?.gateSalidas}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Muelle */}
                        <div className="py-1.5 border-b border-slate-700">
                            <div className="text-xs text-slate-400 mb-1">Muelle:</div>
                            <div className="pl-2 space-y-0.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Entradas:</span>
                                    <div className="flex items-center gap-1">
                                        {isOptimizationActive && hasComparisonData && optData.historico ? (
                                            <>
                                                <span className="text-xs text-slate-500">{optData.historico.muelleEntradas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-green-400">{optData.movimientosDescarga}</span>
                                            </>
                                        ) : !isOptimizationActive && hasComparisonData ? (
                                            <>
                                                <span className="text-xs text-green-400">↓ {bloque.stats?.muelleEntradas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-purple-400">{optData.movimientosDescarga}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-medium text-green-400">↓ {isOptimizationActive ? optData.movimientosDescarga : bloque.stats?.muelleEntradas}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Salidas:</span>
                                    <div className="flex items-center gap-1">
                                        {isOptimizationActive && hasComparisonData && optData.historico ? (
                                            <>
                                                <span className="text-xs text-slate-500">{optData.historico.muelleSalidas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-blue-400">{optData.movimientosCarga}</span>
                                            </>
                                        ) : !isOptimizationActive && hasComparisonData ? (
                                            <>
                                                <span className="text-xs text-blue-400">↑ {bloque.stats?.muelleSalidas}</span>
                                                <ArrowRight size={10} className="text-slate-600" />
                                                <span className="text-xs font-medium text-purple-400">{optData.movimientosCarga}</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-medium text-blue-400">↑ {isOptimizationActive ? optData.movimientosCarga : bloque.stats?.muelleSalidas}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isOptimizationActive && hasComparisonData && optData.historico && optData.historico.yardMovimientos > 0 && (
                            <div className="py-1.5 border-b border-slate-700 bg-green-950/20 rounded">
                                <div className="pl-2 space-y-0.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Real/Ref:</span>
                                        <span className="text-xs font-medium text-slate-400 line-through">
                                            {optData.historico.yardMovimientos} mov
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-green-400">Optimización:</span>
                                        <span className="text-xs font-bold text-green-400">0 mov ✓</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center py-1.5 border-b border-slate-700">
                            <div className="flex items-center text-xs">
                                <Layers size={10} className="text-cyan-400 mr-1" />
                                <span className="text-slate-400">Segregaciones:</span>
                            </div>
                            <span className="text-xs font-medium text-white">{isOptimizationActive ? optData.segregaciones : (bloque.stats?.bahiasTotales || 0)}</span>
                        </div>
                    </>
                ) : (
                    // Vista estándar histórica
                    <>
                        <div className="pb-2">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs text-slate-400">Ocupación</span>
                                <span className="text-xl font-bold" style={{ color }}>{Math.floor(ocupacionActual)}%</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b border-slate-700">
                            <span className="text-xs text-slate-400">Capacidad:</span>
                            <span className="text-xs font-medium text-white">
                                {ocupiedSlots}/{bloque.capacidadTotal}
                            </span>
                        </div>

                        {!isOptimizationActive && !isCamilaActive && bloque.stats && (
                            <>
                                <div className="py-1.5 border-b border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">Gate:</div>
                                    <div className="pl-2 space-y-0.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Entradas:</span>
                                            <span className="text-xs font-medium text-green-400">↓ {bloque.stats.gateEntradas}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Salidas:</span>
                                            <span className="text-xs font-medium text-blue-400">↑ {bloque.stats.gateSalidas}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-1.5 border-b border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">Muelle:</div>
                                    <div className="pl-2 space-y-0.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Entradas:</span>
                                            <span className="text-xs font-medium text-green-400">↓ {bloque.stats.muelleEntradas}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Salidas:</span>
                                            <span className="text-xs font-medium text-blue-400">↑ {bloque.stats.muelleSalidas}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="py-1.5 border-b border-slate-700">
                                    <div className="text-xs text-slate-400 mb-1">Despejos:</div>
                                    <div className="pl-2 space-y-0.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Entre bloques:</span>
                                            <span className="text-xs font-medium text-orange-400">{bloque.stats.despejosBloques}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Entre patios:</span>
                                            <span className="text-xs font-medium text-purple-400">{bloque.stats.despejosPatios}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-1.5">
                                    <span className="text-xs text-slate-400">Bahías:</span>
                                    <span className="text-xs font-medium text-white">
                                        {bloque.stats.bahiasTotales} ({bloque.stats.bahiasReefer} reefer)
                                    </span>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Footer Consolidado */}
                <div className="pt-2 mt-auto border-t border-slate-700">
                    <div className="space-y-1">
                        <div className={`text-center text-[10px] py-1 px-2 rounded border font-medium ${
                            isCamilaActive ? 'bg-teal-950/30 text-teal-400 border-teal-800' :
                            isOptimizationActive ? 'bg-cyan-950/30 text-cyan-400 border-cyan-800' :
                            'bg-blue-950/30 text-blue-400 border-blue-800'
                        }`}>
                            {isCamilaActive ? 'Optimización Camila' :
                             isOptimizationActive ? `Modelo ${activeModelFormatted}` : 
                             'Datos Históricos'}
                        </div>
                        {hasComparisonData && comparison && (
                            <div className="text-center text-[10px] py-1 px-2 rounded border bg-purple-950/30 text-purple-400 border-purple-800 font-medium animate-in fade-in zoom-in-95">
                                Comparativa {comparison.label}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
