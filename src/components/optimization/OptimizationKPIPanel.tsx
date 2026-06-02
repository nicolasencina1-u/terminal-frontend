// src/components/optimization/OptimizationKPIPanel.tsx
import React, { useMemo } from 'react';
import { useOptimizationData } from '../../hooks/useOptimizationData'; 
import { useOptimizationModelContext } from '../../contexts/OptimizationModelContext';
import type { OptimizationMetrics } from '../../types/optimization';
import {
    TrendingUp, TrendingDown, Target, BarChart3, Layers, CheckCircle,
    AlertCircle, Navigation, Package, ArrowRightLeft, Calendar, Truck
} from 'lucide-react';

interface OptimizationKPIPanelProps {
    data?: OptimizationMetrics | null;
    isLoading?: boolean;
    error?: string | null;
}

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ReactNode;
    color: 'green' | 'blue' | 'cyan' | 'orange' | 'red' | 'teal' | 'purple' | 'amber' | 'emerald';
    isLoading?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, trend, icon, color, isLoading = false }) => {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-950/30 border-green-700 text-green-300',
        blue: 'bg-blue-950/30 border-blue-700 text-blue-300',
        cyan: 'bg-cyan-950/30 border-cyan-700 text-cyan-300',
        teal: 'bg-teal-950/30 border-teal-700 text-teal-300',
        orange: 'bg-orange-950/30 border-orange-700 text-orange-300',
        red: 'bg-red-950/30 border-red-700 text-red-300',
        purple: 'bg-purple-950/30 border-purple-700 text-purple-300',
        amber: 'bg-amber-950/30 border-amber-700 text-amber-300',
        emerald: 'bg-emerald-950/30 border-emerald-700 text-emerald-300',
    };
    const iconColorClasses: Record<string, string> = {
        green: 'text-green-400', blue: 'text-blue-400', cyan: 'text-cyan-400',
        teal: 'text-teal-400', orange: 'text-orange-400', red: 'text-red-400',
        purple: 'text-purple-400', amber: 'text-amber-400', emerald: 'text-emerald-400',
    };

    if (isLoading) {
        return (
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 animate-pulse">
                <div className="flex justify-between mb-2"><div className="h-4 bg-slate-700 w-20 rounded"></div><div className="h-5 w-5 bg-slate-700 rounded"></div></div>
                <div className="h-8 bg-slate-700 w-16 rounded"></div>
            </div>
        );
    }

    return (
        <div className={`rounded-lg border p-4 ${colorClasses[color] || colorClasses.blue}`}>
            <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium">{title}</h3>
                <div className={iconColorClasses[color] || iconColorClasses.blue}>{icon}</div>
            </div>
            <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('es-CL') : value}</p>
                {trend && (
                    <div className={`flex items-center ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : trend === 'down' ? <TrendingDown size={16} /> : null}
                    </div>
                )}
            </div>
            {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
        </div>
    );
};

export const OptimizationKPIPanel: React.FC<OptimizationKPIPanelProps> = ({
    data: externalData,
    isLoading: externalLoading,
    error: externalError
}) => {
    const { config: modelConfig, activeModel } = useOptimizationModelContext();
    
    const isExternal = !!externalData; 

    const extAnio = externalData?.anio;
    const extSemana = externalData?.semana;
    const extPart = externalData?.participacion;
    const extDisp = externalData?.conDispersion;

    const historyConfig = useMemo(() => {
        if (isExternal) {
            return {
                anio: extAnio || 0,
                semana: extSemana || 0,
                participacion: extPart || 68,
                conDispersion: extDisp || false,
                variant: modelConfig.variant
            };
        }
        return modelConfig;
    }, [isExternal, extAnio, extSemana, extPart, extDisp, modelConfig]);

    const { metrics: optMetrics, isLoading: optLoading, error: optError } = useOptimizationData(modelConfig);

    const { metrics: historyMetrics, isLoading: histLoading } = useOptimizationData(historyConfig);

    const metrics = useMemo(() => {
        try {
            const raw = externalData || optMetrics;
            if (!raw) return null;

            const historiaExterna = historyMetrics?.movimientos?.porTipo;
            const historiaModelo = raw.movimientos?.porTipo || {}; 

            const totalHistoriaModelo = Object.values(historiaModelo).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);

            const usarHistoriaExterna = totalHistoriaModelo === 0 && !!historiaExterna;
            const movimientosRealesRaw = (usarHistoriaExterna ? historiaExterna : historiaModelo) || {};

            let totalReal = Object.values(movimientosRealesRaw).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
            
            if (usarHistoriaExterna && historyMetrics?.movimientos?.totalReal) {
                totalReal = historyMetrics.movimientos.totalReal;
            }

            const yardEliminados = movimientosRealesRaw.YARD || raw.movimientos?.yardEliminados || 0;
            const movimientosOptimizados = raw.movimientos?.optimizados || 0;

            const isSimulationWithoutHistory = totalReal === 0;
            const baseReal = isSimulationWithoutHistory ? (movimientosOptimizados + yardEliminados) : totalReal;

            const reduccionReal = baseReal - movimientosOptimizados;
            const reduccionPorcentaje = baseReal > 0 ? (reduccionReal / baseReal * 100) : 0;
            
            let eficienciaGanada = raw.eficiencia?.ganancia || 0;

            if(usarHistoriaExterna && baseReal > 0){
                eficienciaGanada = reduccionPorcentaje;
            }

            let distReal = raw.distancias?.totalReal || 0;
            if (usarHistoriaExterna && historyMetrics?.distancias?.totalReal) {
                distReal = historyMetrics.distancias.totalReal;
            }
            const distModel = raw.distancias?.totalModelo || 0;

            const distAhorrada = usarHistoriaExterna ? (distReal - distModel) : (raw.distancias?.distanciaAhorrada || 0);

            return {
                ...raw,
                eficiencia:{
                    ...raw.eficiencia,
                    ganancia: eficienciaGanada
                },
                distancias: {
                    ...raw.distancias,
                    totalReal: distReal,
                    distanciaAhorrada: distAhorrada
                },
                calculated: {
                    isSimulation: isSimulationWithoutHistory,
                    totalReal: baseReal,
                    yardEliminados,
                    reduccionReal,
                    reduccionPorcentaje,
                    movimientosRealesDetalle: movimientosRealesRaw,
                    labelEficiencia: isSimulationWithoutHistory ? "Eficiencia Operativa" : "Eficiencia Ganada",
                    labelSubtitleReal: isSimulationWithoutHistory ? "proyectados (Simulación)" : "reales",
                    theme: isExternal ? 'emerald' : 'cyan'
                }
            };
        } catch (err) {
            console.error("Error calculando métricas en panel:", err);
            return null;
        }
    }, [externalData, optMetrics, historyMetrics, isExternal]);

    const isLoading = isExternal ? (externalLoading || histLoading) : (optLoading || histLoading);
    const error = isExternal ? externalError : (optError);

    const themeColor = metrics?.calculated?.theme || 'cyan';
    const themeConfig = themeColor === 'emerald'
        ? { border: 'border-emerald-700', bg: 'from-emerald-900/30 to-teal-900/30', text: 'text-emerald-400', subtext: 'text-emerald-200' }
        : { border: 'border-cyan-700', bg: 'from-cyan-900/30 to-blue-900/30', text: 'text-cyan-400', subtext: 'text-slate-300' };

    if (error) {
        return (
            <div className="bg-slate-800 rounded-lg border border-red-700 p-6">
                <div className="flex items-center text-red-400 mb-2"><AlertCircle size={20} className="mr-2" /><h3 className="font-semibold">Error al cargar datos</h3></div>
                <p className="text-sm text-red-300">{error}</p>
            </div>
        );
    }

    if (!metrics && !isLoading) {
        return <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center text-slate-400">No hay datos disponibles.</div>;
    }

    return (
        <div className="space-y-4">
            <div className={`bg-gradient-to-r ${themeConfig.bg} rounded-lg p-4 border ${themeConfig.border}`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100 flex items-center capitalize">
                            <BarChart3 size={24} className={`mr-2 ${themeConfig.text}`} />
                            KPIs - {activeModel === 'e-constraint' ? 'E-Constraint' : activeModel.charAt(0).toUpperCase() + activeModel.slice(1)}
                        </h2>
                        <p className={`text-sm ${themeConfig.subtext} mt-1 flex items-center`}>
                            <Calendar size={14} className="mr-1" />
                            {metrics?.anio || modelConfig.anio} • Sem {metrics?.semana || modelConfig.semana} • Part {metrics?.participacion || modelConfig.participacion}%
                        </p>
                    </div>
                    {isLoading && <div className={`text-sm ${themeConfig.text}`}>Cargando...</div>}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={metrics?.calculated?.labelEficiencia || "Eficiencia"} value={`${metrics?.eficiencia?.ganancia?.toFixed(2) || 0}%`} subtitle={metrics?.calculated?.isSimulation ? "Nivel de servicio" : "Mejora operativa"} trend="up" icon={<TrendingUp size={20} />} color={themeColor === 'emerald' ? "emerald" : "green"} isLoading={isLoading} />
                <KPICard title="YARD Eliminados" value={metrics?.calculated?.yardEliminados || 0} subtitle="100% eliminación" trend="down" icon={<CheckCircle size={20} />} color="blue" isLoading={isLoading} />
                <KPICard title="Reducción Movs" value={`${metrics?.calculated?.reduccionPorcentaje?.toFixed(1) || 0}%`} subtitle={`${metrics?.calculated?.reduccionReal?.toLocaleString() || 0} menos`} trend="down" icon={<ArrowRightLeft size={20} />} color={themeColor === 'emerald' ? "teal" : "cyan"} isLoading={isLoading} />
                <KPICard title="Distancia Ahorrada" value={metrics?.distancias?.distanciaAhorrada ? `${(Math.abs(metrics.distancias.distanciaAhorrada) / 1000).toFixed(1)} km` : '0 km'} subtitle="Metros ahorrados" trend="down" icon={<Navigation size={20} />} color="purple" isLoading={isLoading} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Segregaciones" value={metrics?.segregaciones?.total || 0} subtitle="Activas" icon={<Layers size={20} />} color={themeColor === 'emerald' ? "emerald" : "teal"} isLoading={isLoading} />
                <KPICard title="Balance Carga" value={metrics?.cargaTrabajo?.balance?.toFixed(1) || '0.0'} subtitle="Desviación std" trend={metrics?.cargaTrabajo?.balance && metrics.cargaTrabajo.balance < 50 ? 'down' : 'up'} icon={<BarChart3 size={20} />} color={metrics?.cargaTrabajo?.balance && metrics.cargaTrabajo.balance < 50 ? 'green' : 'orange'} isLoading={isLoading} />
                <KPICard title="Ocupación" value={`${metrics?.ocupacion?.promedio?.toFixed(1) || 0}%`} subtitle={`${(metrics?.ocupacion?.capacidadTotal || 0).toLocaleString()} TEUs`} icon={<Package size={20} />} color="blue" isLoading={isLoading} />
                <KPICard title="Total Movs" value={metrics?.movimientos?.optimizados || 0} subtitle={`vs ${metrics?.calculated?.totalReal?.toLocaleString() || 0} ${metrics?.calculated?.labelSubtitleReal || ''}`} icon={<Target size={20} />} color="amber" isLoading={isLoading} />
            </div>

            {metrics && metrics.calculated && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                        <h3 className="font-medium text-slate-100 mb-3 flex items-center"><Truck size={16} className="mr-2 text-blue-400" /> Movimientos por Tipo</h3>
                        <div className="space-y-2">
                            {['DLVR', 'RECV', 'LOAD', 'DSCH', 'YARD'].map(type => {
                                const detalle = metrics.calculated.movimientosRealesDetalle || {};
                                const real = detalle[type] || 0;
                                let opt = 0;
                                if (metrics.movimientos?.optimizadosPorTipo) {
                                    if (type === 'DLVR') opt = metrics.movimientos.optimizadosPorTipo.entrega;
                                    if (type === 'RECV') opt = metrics.movimientos.optimizadosPorTipo.recepcion;
                                    if (type === 'LOAD') opt = metrics.movimientos.optimizadosPorTipo.carga;
                                    if (type === 'DSCH') opt = metrics.movimientos.optimizadosPorTipo.descarga;
                                }
                                return (
                                    <div key={type} className="flex justify-between text-sm border-b border-slate-700/50 pb-1 last:border-0">
                                        <span className="text-slate-400 w-24">{type === 'YARD' ? 'Reubic.' : type}</span>
                                        <div className="flex gap-2">
                                            <span className="text-red-400">{real.toLocaleString()}</span>
                                            <span className="text-slate-600">→</span>
                                            <span className="text-green-400 font-bold">{opt.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                        <h3 className="font-medium text-slate-100 mb-3 flex items-center"><Navigation size={16} className="mr-2 text-purple-400" /> Impacto en Distancias</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-slate-400">Real</span><span className="text-slate-200">{(metrics.distancias?.totalReal / 1000 || 0).toFixed(1)} km</span></div>
                            <div className="flex justify-between text-sm"><span className="text-slate-400">Optimizado</span><span className="text-green-400">{(metrics.distancias?.totalModelo / 1000 || 0).toFixed(1)} km</span></div>
                            {!metrics.calculated.isSimulation && (
                                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                    <div className="h-2 bg-purple-500" style={{ width: `${Math.min((metrics.distancias?.totalModelo / (metrics.distancias?.totalReal || 1)) * 100, 100)}%` }}></div>
                                </div>
                            )}
                            <div className="text-center pt-2 border-t border-slate-700 mt-2">
                                <div className="text-2xl font-bold text-purple-400">{(Math.abs(metrics.distancias?.distanciaAhorrada || 0) / 1000).toFixed(2)} km</div>
                                <div className="text-xs text-slate-400">Ahorro Estimado</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OptimizationKPIPanel;