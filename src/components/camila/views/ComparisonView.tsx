// src/components/camila/views/ComparisonView.tsx

import React, { useState } from 'react';
import {
    GitCompare, TrendingUp, AlertTriangle, CheckCircle,
    BarChart3, Activity, Info
} from 'lucide-react';
import type { DashboardEjecutivoResponse } from '../../../types/camila';

interface Props {
    data: DashboardEjecutivoResponse;
}

const ComparisonView: React.FC<Props> = ({ data }) => {
    const [tipoComparacion, setTipoComparacion] = useState<'flujos' | 'bloques'>('flujos');
    const { comparacion_detallada, analisis_bloques } = data.tabs;

    const getColorDiferencia = (diferencia: number) => {
        const abs = Math.abs(diferencia);
        if (abs <= 5) return 'text-green-400';
        if (abs <= 20) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Resumen de Comparación */}
            <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 rounded-lg p-6 border border-green-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-slate-300 text-sm mb-1">Movimientos Modelo</p>
                        <p className="text-3xl font-bold text-cyan-400">
                            {comparacion_detallada.resumen.movimientos_modelo.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-300 text-sm mb-1">Movimientos Real</p>
                        <p className="text-3xl font-bold text-green-400">
                            {comparacion_detallada.resumen.movimientos_real.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-300 text-sm mb-1">Coincidencia</p>
                        <p className={`text-3xl font-bold ${comparacion_detallada.resumen.coincidencia_total >= 90
                            ? 'text-green-400'
                            : 'text-amber-400'
                            }`}>
                            {comparacion_detallada.resumen.coincidencia_total}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-300 text-sm mb-1">Diferencias Críticas</p>
                        <p className={`text-3xl font-bold ${comparacion_detallada.resumen.diferencias_criticas > 0
                            ? 'text-red-400'
                            : 'text-green-400'
                            }`}>
                            {comparacion_detallada.resumen.diferencias_criticas}
                        </p>
                    </div>
                </div>
            </div>

            {/* Selector de tipo de comparación */}
            <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setTipoComparacion('flujos')}
                    className={`px-4 py-2 rounded-lg transition-colors ${tipoComparacion === 'flujos'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-50'
                        }`}
                >
                    Por Tipo de Flujo
                </button>
                <button
                    onClick={() => setTipoComparacion('bloques')}
                    className={`px-4 py-2 rounded-lg transition-colors ${tipoComparacion === 'bloques'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-50'
                        }`}
                >
                    Por Bloque
                </button>
            </div>

            {/* Comparación por Tipo de Flujo */}
            {tipoComparacion === 'flujos' && (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                        <Activity className="mr-2 text-cyan-400" size={20} />
                        Comparación por Tipo de Operación
                    </h3>
                    <div className="space-y-4">
                        {comparacion_detallada.por_tipo_flujo.map(item => (
                            <div key={item.subtipo} className="border-b border-slate-700 pb-4 last:border-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-lg text-slate-50">{item.subtipo}</h4>
                                    <div className="flex items-center space-x-4">
                                        {item.match ? (
                                            <CheckCircle className="text-green-400" size={20} />
                                        ) : (
                                            <AlertTriangle className="text-amber-400" size={20} />
                                        )}
                                        <span className={`font-bold ${getColorDiferencia(item.diferencia_pct)}`}>
                                            {item.diferencia > 0 ? '+' : ''}{item.diferencia_pct.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-400">Modelo</p>
                                        <p className="font-semibold text-slate-300">{item.modelo}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Real</p>
                                        <p className="font-semibold text-slate-300">{item.real}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Diferencia</p>
                                        <p className={`font-semibold ${getColorDiferencia(item.diferencia_pct)}`}>
                                            {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${item.precision >= 90 ? 'bg-green-500' :
                                                item.precision >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                                }`}
                                            style={{ width: `${item.precision}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Precisión: {item.precision.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comparación por Bloque - Heatmap */}
            {tipoComparacion === 'bloques' && (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                        <BarChart3 className="mr-2 text-cyan-400" size={20} />
                        Comparación por Bloque
                    </h3>

                    {/* Heatmap Visual */}
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {analisis_bloques.comparacion_visual.bloques.map((bloque, idx) => {
                            const modelo = analisis_bloques.comparacion_visual.modelo[idx];
                            const real = analisis_bloques.comparacion_visual.real[idx];
                            const diferencia = analisis_bloques.comparacion_visual.diferencias[idx];
                            const porcentaje = real > 0 ? ((diferencia / real) * 100) : 0;

                            return (
                                <div
                                    key={bloque}
                                    className={`p-4 rounded-lg border text-center ${Math.abs(porcentaje) <= 10 ? 'bg-green-950/30 border-green-700' :
                                        Math.abs(porcentaje) <= 30 ? 'bg-amber-950/30 border-amber-700' :
                                            'bg-red-950/30 border-red-700'
                                        }`}
                                >
                                    <p className="font-bold text-lg mb-1 text-slate-50">{bloque}</p>
                                    <p className="text-sm text-slate-400">M: {modelo}</p>
                                    <p className="text-sm text-slate-400">R: {real}</p>
                                    <p className={`text-sm font-bold mt-1 ${getColorDiferencia(porcentaje)}`}>
                                        {diferencia > 0 ? '+' : ''}{diferencia}
                                    </p>
                                </div>
                            );
                        })}
                    </div>


                </div>
            )}

            {/* Diferencias Principales */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-amber-400" size={20} />
                    Top 5 Diferencias Principales
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Tipo</th>
                                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Elemento</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Modelo</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Real</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Dif.</th>
                                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">%</th>
                                <th className="text-center py-3 px-4 text-sm font-medium text-slate-400">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparacion_detallada.diferencias_principales.map((dif, idx) => (
                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="py-3 px-4 text-slate-300">{dif.tipo}</td>
                                    <td className="py-3 px-4 font-medium text-slate-300">{dif.subtipo}</td>
                                    <td className="py-3 px-4 text-right text-slate-300">{dif.modelo}</td>
                                    <td className="py-3 px-4 text-right text-slate-300">{dif.real}</td>
                                    <td className={`py-3 px-4 text-right font-medium ${getColorDiferencia(dif.diferencia_pct)
                                        }`}>
                                        {dif.diferencia > 0 ? '+' : ''}{dif.diferencia}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-medium ${getColorDiferencia(dif.diferencia_pct)
                                        }`}>
                                        {dif.diferencia_pct.toFixed(1)}%
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {dif.requiere_accion && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-950/50 text-red-400 border border-red-700">
                                                Revisar
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-cyan-950/30 rounded-lg p-4 border border-cyan-700">
                <div className="flex items-start">
                    <Info size={20} className="text-cyan-400 mr-3 mt-0.5" />
                    <div className="text-sm text-cyan-300">
                        <p>Las diferencias entre el modelo y la operación real son esperadas. El modelo busca optimizar
                            los movimientos mientras que la operación real puede tener restricciones adicionales no consideradas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparisonView;