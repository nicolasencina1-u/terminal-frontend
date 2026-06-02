// src/components/map/views/patio/PatioDetails.tsx
import React from 'react';
import { Info, GitCompare, BarChart3, TrendingUp, Package, Activity, Eye } from 'lucide-react';
import { getCamilaDataForBlock, getOptimizationModelDataForBlock, getAggregatedStats } from './patioDataHelpers';
import type { CamilaDashboardData } from '../../../../types/camila';
import type { OptimizationMetrics } from '../../../../types/optimization';

interface PatioDetailsProps {
    selectedBloque: string;
    isCamilaActive: boolean;
    isOptimizationActive: boolean;
    activeModelName: string;
    currentPeriod: number;
    currentTurno?: number;
    camilaData?: CamilaDashboardData | null;
    optimizationMetrics: OptimizationMetrics | null;
    referenceMetrics?: OptimizationMetrics | null;
    comparisonType?: comparisonSource;
}

export const PatioDetails: React.FC<PatioDetailsProps> = ({
    selectedBloque,
    isCamilaActive,
    isOptimizationActive,
    activeModelName = 'Magdalena',
    currentPeriod,
    currentTurno,
    camilaData,
    optimizationMetrics,
    referenceMetrics,
    comparisonType = 'historico'
}) => {
    const turno = currentTurno || Math.ceil(currentPeriod / 8);
    const aggregatedStats = getAggregatedStats(optimizationMetrics, camilaData, currentPeriod);

    const formatModelName = (name: string) => {
        if (!name) return '';
        if (name.toLowerCase() === 'e-constraint') return 'E-Constraint';
        return name.charAt(0).toUpperCase() + name.slice(1);
    };
    const activeModelFormatted = formatModelName(activeModelName);

    return (
        <>
            {isCamilaActive && camilaData && (
                <div className="mt-4 bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                        <Info size={20} className="mr-2 text-teal-400" />
                        Detalles del Bloque {selectedBloque} - Camila
                    </h3>
                    {(() => {
                        const blockData = getCamilaDataForBlock(selectedBloque, camilaData, currentPeriod);
                        if (!blockData || blockData.asignaciones.length === 0) {
                            return <div className="text-center py-4 text-slate-400"><p>No hay asignaciones para este bloque en el período {currentPeriod}</p></div>;
                        }

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-teal-400 mb-2">Movimientos Asignados</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm"><span className="text-slate-300">Total</span><span className="font-medium text-teal-300">{blockData.asignaciones.reduce((sum, a) => sum + a.movimientos_asignados, 0)} mov.</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-300">Asignaciones</span><span className="font-medium text-teal-300">{blockData.asignaciones.length}</span></div>
                                    </div>
                                </div>
                                <div className="bg-slate-700/50 rounded-lg p-3">
                                    <h4 className="text-sm font-medium text-purple-400 mb-2">Grúas Asignadas</h4>
                                    {blockData.gruas.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {blockData.gruas.map(grua => (
                                                <div key={grua} className="px-2 py-1 bg-purple-950/50 rounded border border-purple-700"><span className="text-sm font-medium text-purple-300">Grúa {grua}</span></div>
                                            ))}
                                        </div>
                                    ) : (<p className="text-sm text-slate-400">Sin grúas asignadas</p>)}
                                </div>
                                {blockData.cuotas && (
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-blue-400 mb-2">Cuota de Camiones</h4>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Cuota:</span><span className="font-medium text-blue-300">{blockData.cuotas.cuota_modelo}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Capacidad:</span><span className="font-medium text-slate-300">{blockData.cuotas.capacidad_maxima}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Utilización:</span><span className="font-medium text-blue-300">{blockData.cuotas.capacidad_maxima > 0 ? ((blockData.cuotas.cuota_modelo / blockData.cuotas.capacidad_maxima) * 100).toFixed(1) : '0.0'}%</span></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <div className="mt-4 p-3 bg-teal-950/20 rounded-lg border border-teal-800"><p className="text-sm text-teal-400 flex items-center"><Eye size={16} className="mr-2" />Este bloque está sincronizado con el Dashboard Ejecutivo</p></div>
                </div>
            )}

            {isOptimizationActive && optimizationMetrics && (
                <div className="mt-4 bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center capitalize">
                        <Info size={20} className="mr-2 text-cyan-400" />
                        Detalles del Bloque {selectedBloque} - {activeModelFormatted}
                    </h3>

                    {(() => {
                        const blockData = getOptimizationModelDataForBlock(
                            selectedBloque, 
                            optimizationMetrics, 
                            turno,
                            referenceMetrics,
                            comparisonType
                        );
                        if (!blockData) {
                            return <div className="text-center py-4 text-slate-400"><p>No hay datos de optimización para este bloque</p></div>;
                        }

                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center"><TrendingUp size={16} className="mr-1" />Carga de Trabajo</h4>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Actual:</span><span className="font-medium text-orange-300">{blockData.cargaTrabajo}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Máxima:</span><span className="font-medium text-red-300">{blockData.cargaMaxima}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Mínima:</span><span className="font-medium text-green-300">{blockData.cargaMinima}</span></div>
                                            <div className="flex justify-between text-sm border-t border-slate-600 pt-1 mt-1"><span className="text-slate-300">Variación:</span><span className="font-medium text-orange-300">{blockData.variacionCarga}</span></div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center"><Package size={16} className="mr-1" />Segregaciones</h4>
                                        <div className="text-center"><div className="text-2xl font-bold text-blue-300">{blockData.segregaciones}</div><div className="text-xs text-slate-400">Segregaciones activas</div></div>
                                        {blockData.movimientosTotales > 0 && (<div className="mt-2 pt-2 border-t border-slate-600"><div className="flex justify-between text-sm"><span className="text-slate-300">Movimientos:</span><span className="font-medium text-blue-300">{blockData.movimientosTotales}</span></div></div>)}
                                    </div>
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-purple-400 mb-2">Volumen</h4>
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">TEUs promedio:</span><span className="font-medium text-purple-300">{blockData.teusPromedio}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Capacidad:</span><span className="font-medium text-purple-300">{blockData.capacidad} TEUs</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-300">Utilización:</span><span className="font-medium text-purple-300">{blockData.utilizacionPromedio.toFixed(1)}%</span></div>
                                            <div className="flex justify-between text-sm border-t border-slate-600 pt-1 mt-1"><span className="text-slate-300">Rango:</span><span className="font-medium text-purple-300">{blockData.rangoOcupacion.toFixed(1)}%</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-green-400 mb-2">Movimientos por Tipo</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm"><span className="text-slate-300">Recepción:</span><span className="font-medium text-green-300">{blockData.movimientosRecepcion}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-slate-300">Carga:</span><span className="font-medium text-blue-300">{blockData.movimientosCarga}</span></div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm"><span className="text-slate-300">Descarga:</span><span className="font-medium text-orange-300">{blockData.movimientosDescarga}</span></div>
                                                <div className="flex justify-between text-sm"><span className="text-slate-300">Entrega:</span><span className="font-medium text-purple-300">{blockData.movimientosEntrega}</span></div>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-600"><div className="flex justify-between text-sm"><span className="text-slate-300 font-medium">Total:</span><span className="font-bold text-green-300">{blockData.movimientosTotales}</span></div></div>
                                    </div>
                                    <div className="bg-slate-700/50 rounded-lg p-3">
                                        <h4 className="text-sm font-medium text-amber-400 mb-2">Segregaciones Asignadas</h4>
                                        {blockData.segregacionesDetalle.length > 0 ? (
                                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                                {blockData.segregacionesDetalle.slice(0, 4).map((seg, idx) => (
                                                    <div key={idx} className="flex justify-between text-xs"><span className="text-slate-300 truncate max-w-[60%]" title={seg.descripcion}>{seg.codigo}</span><span className="font-medium text-amber-300">{seg.movimientos} mov</span></div>
                                                ))}
                                                {blockData.segregacionesDetalle.length > 4 && (<div className="text-xs text-slate-400 text-center pt-1">+{blockData.segregacionesDetalle.length - 4} más</div>)}
                                            </div>
                                        ) : (<p className="text-sm text-slate-400">Sin segregaciones asignadas</p>)}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {optimizationMetrics && camilaData && (
                <div className="mt-4 bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                        <GitCompare size={20} className="mr-2 text-amber-400" />
                        Comparación de Modelos - Bloque {selectedBloque}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-cyan-950/20 rounded-lg p-3 border border-cyan-800">
                            <h4 className="text-sm font-medium text-cyan-400 mb-2 capitalize">Modelo {activeModelFormatted}</h4>
                            {(() => {
                                const data = getOptimizationModelDataForBlock(selectedBloque, optimizationMetrics, turno);
                                return data ? (
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-300">Ocupación promedio:</span><span className="font-medium text-cyan-300">{data.ocupacionPromedio.toFixed(1)}%</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Segregaciones:</span><span className="font-medium text-cyan-300">{data.segregaciones}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Carga de trabajo:</span><span className="font-medium text-cyan-300">{data.cargaTrabajo}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Movimientos totales:</span><span className="font-medium text-cyan-300">{data.movimientosTotales}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Capacidad:</span><span className="font-medium text-cyan-300">{data.capacidad} TEUs</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Enfoque:</span><span className="font-medium text-cyan-300">Espacios</span></div>
                                    </div>
                                ) : (<p className="text-slate-400 text-sm">Sin datos disponibles</p>);
                            })()}
                        </div>
                        <div className="bg-teal-950/20 rounded-lg p-3 border border-teal-800">
                            <h4 className="text-sm font-medium text-teal-400 mb-2">Modelo Camila</h4>
                            {(() => {
                                const data = getCamilaDataForBlock(selectedBloque, camilaData, currentPeriod);
                                return data && data.asignaciones.length > 0 ? (
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-300">Movimientos:</span><span className="font-medium text-teal-300">{data.asignaciones.reduce((sum, a) => sum + a.movimientos_asignados, 0)}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Grúas asignadas:</span><span className="font-medium text-teal-300">{data.gruas.length}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-300">Enfoque:</span><span className="font-medium text-teal-300">Workload</span></div>
                                    </div>
                                ) : (<p className="text-slate-400 text-sm">Sin asignaciones en período actual</p>);
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {(isCamilaActive || isOptimizationActive) && (
                <div className="mt-4 bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
                    <h3 className="text-lg font-semibold text-slate-100 mb-3 flex items-center">
                        <BarChart3 size={20} className="mr-2 text-blue-400" />
                        Resumen del {isCamilaActive ? `Período ${currentPeriod}` : `Turno ${turno}`}
                    </h3>

                    {isCamilaActive && camilaData && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center"><div className="text-2xl font-bold text-teal-400">{aggregatedStats.camila.asignacionesActivas}</div><div className="text-sm text-slate-400">Asignaciones activas</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-purple-400">{aggregatedStats.camila.movimientosTotales}</div><div className="text-sm text-slate-400">Total movimientos</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-blue-400">{aggregatedStats.camila.bloquesActivos}</div><div className="text-sm text-slate-400">Bloques activos</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-orange-400">{aggregatedStats.camila.gruasOperando}</div><div className="text-sm text-slate-400">Grúas operando</div></div>
                        </div>
                    )}

                    {isOptimizationActive && optimizationMetrics && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                            <div className="text-center"><div className="text-2xl font-bold text-cyan-400">{aggregatedStats.optimizationModel.ocupacionPromedio.toFixed(1)}%</div><div className="text-sm text-slate-400">Ocupación promedio</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-green-400">{aggregatedStats.optimizationModel.movimientosOptimizados}</div><div className="text-sm text-slate-400">Movimientos optimizados</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-red-400">{aggregatedStats.optimizationModel.yardEliminados}</div><div className="text-sm text-slate-400">YARD eliminados</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-blue-400">{aggregatedStats.optimizationModel.segregacionesActivas}</div><div className="text-sm text-slate-400">Segregaciones activas</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-orange-400">{aggregatedStats.optimizationModel.cargaTrabajoTotal}</div><div className="text-sm text-slate-400">Carga total</div></div>
                            <div className="text-center"><div className="text-2xl font-bold text-purple-400">{(aggregatedStats.optimizationModel.distanciaAhorrada / 1000).toFixed(1)}km</div><div className="text-sm text-slate-400">Distancia ahorrada</div></div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg text-center">
                <p className="text-sm text-slate-400">
                    {isCamilaActive && 'Optimización de asignación de grúas RTG con minimización de movimientos'}
                    {isOptimizationActive && `Optimización de espacios con el modelo ${activeModelFormatted}`}
                    {!isCamilaActive && !isOptimizationActive && 'Vista histórica del estado real del patio'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Última actualización: {new Date().toLocaleTimeString('es-CL')}</p>
            </div>
        </>
    );
};