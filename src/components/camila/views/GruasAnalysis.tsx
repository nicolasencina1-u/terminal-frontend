// src/components/camila/components/GruasAnalysis.tsx

import React, { useState } from 'react';
import {
    Settings, TrendingUp, AlertTriangle, Users,
    Activity, BarChart3, RefreshCw, Clock,
    CheckCircle, XCircle, Info
} from 'lucide-react';
import type { DashboardEjecutivoResponse } from '../../../types/camila';

interface Props {
    data: DashboardEjecutivoResponse;
}

const GruasAnalysis: React.FC<Props> = ({ data }) => {
    const [vistaActiva, setVistaActiva] = useState<'kpis' | 'detalle' | 'matriz'>('kpis');
    const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
    const [selectedBloque, setSelectedBloque] = useState<string | null>(null);
    const { metricas_gruas } = data.tabs;

    const getColorUtilizacion = (porcentaje: number) => {
        const valor = Math.min(porcentaje, 100);
        if (valor >= 70 && valor <= 85) return 'text-green-400';
        if (valor < 60) return 'text-red-400';
        if (valor > 90) return 'text-amber-400';
        return 'text-amber-400';
    };

    return (
        <div className="space-y-6">
            {/* Navegación de sub-vistas */}
            <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setVistaActiva('kpis')}
                    className={`px-4 py-2 rounded-lg transition-colors ${vistaActiva === 'kpis'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-400 hover:text-slate-50'
                        }`}
                >
                    KPIs de Grúas
                </button>
                <button
                    onClick={() => setVistaActiva('detalle')}
                    className={`px-4 py-2 rounded-lg transition-colors ${vistaActiva === 'detalle'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-400 hover:text-slate-50'
                        }`}
                >
                    Detalle por Grúa
                </button>
                <button
                    onClick={() => setVistaActiva('matriz')}
                    className={`px-4 py-2 rounded-lg transition-colors ${vistaActiva === 'matriz'
                            ? 'bg-cyan-600 text-white'
                            : 'text-slate-400 hover:text-slate-50'
                        }`}
                >
                    Matriz Asignación
                </button>
            </div>

            {/* Vista KPIs */}
            {vistaActiva === 'kpis' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Utilización de Grúas */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <Users className="mr-2 text-green-400" size={20} />
                                Utilización
                            </h3>
                            <span className={`text-3xl font-bold ${getColorUtilizacion(Math.min(metricas_gruas.resumen.utilizacion_gruas.porcentaje, 100))
                                }`}>
                                {Math.min(metricas_gruas.resumen.utilizacion_gruas.porcentaje, 100)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Grúas activas</span>
                                <span className="font-medium text-slate-300">
                                    {metricas_gruas.resumen.utilizacion_gruas.activas}/
                                    {metricas_gruas.resumen.utilizacion_gruas.total}
                                </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${metricas_gruas.resumen.utilizacion_gruas.categoria === 'OPTIMA'
                                            ? 'bg-green-500'
                                            : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${Math.min(metricas_gruas.resumen.utilizacion_gruas.porcentaje, 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-500">Meta: 70-85%</p>
                        </div>
                    </div>

                    {/* Productividad */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <TrendingUp className="mr-2 text-cyan-400" size={20} />
                                Productividad
                            </h3>
                            <span className="text-3xl font-bold text-cyan-400">
                                {metricas_gruas.resumen.productividad_por_grua.promedio.toFixed(1)}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Meta</span>
                                <span className="font-medium text-slate-300">
                                    {metricas_gruas.resumen.productividad_por_grua.meta} mov/hora
                                </span>
                            </div>
                            <div className="flex items-center justify-center">
                                {metricas_gruas.resumen.productividad_por_grua.cumple ? (
                                    <CheckCircle className="text-green-400" size={32} />
                                ) : (
                                    <XCircle className="text-red-400" size={32} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Distribución de Carga */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <BarChart3 className="mr-2 text-purple-400" size={20} />
                                Distribución
                            </h3>
                            <span className={`text-3xl font-bold ${metricas_gruas.resumen.distribucion_carga.categoria === 'EQUILIBRADA'
                                    ? 'text-green-400'
                                    : 'text-amber-400'
                                }`}>
                                {metricas_gruas.resumen.distribucion_carga.cv.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Variación (CV)</span>
                                <span className="font-medium text-slate-300">
                                    {metricas_gruas.resumen.distribucion_carga.categoria}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">CV &lt; 15% = Equilibrada</p>
                        </div>
                    </div>

                    {/* Interferencia */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <AlertTriangle className="mr-2 text-amber-400" size={20} />
                                Interferencia
                            </h3>
                            <span className={`text-3xl font-bold ${metricas_gruas.resumen.interferencia.nivel === 'BAJO'
                                    ? 'text-green-400'
                                    : 'text-amber-400'
                                }`}>
                                {metricas_gruas.resumen.interferencia.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Nivel</span>
                                <span className={`font-medium ${metricas_gruas.resumen.interferencia.nivel === 'BAJO'
                                        ? 'text-green-400'
                                        : 'text-amber-400'
                                    }`}>
                                    {metricas_gruas.resumen.interferencia.nivel}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">Grúas en bloques adyacentes</p>
                        </div>
                    </div>

                    {/* Reasignaciones */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <RefreshCw className="mr-2 text-cyan-400" size={20} />
                                Reasignaciones
                            </h3>
                            <span className={`text-3xl font-bold ${metricas_gruas.resumen.reasignaciones.eficiencia === 'ALTA'
                                    ? 'text-green-400'
                                    : 'text-amber-400'
                                }`}>
                                {metricas_gruas.resumen.reasignaciones.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Eficiencia</span>
                                <span className={`font-medium ${metricas_gruas.resumen.reasignaciones.eficiencia === 'ALTA'
                                        ? 'text-green-400'
                                        : 'text-amber-400'
                                    }`}>
                                    {metricas_gruas.resumen.reasignaciones.eficiencia}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">Meta: &lt; 10%</p>
                        </div>
                    </div>

                    {/* Tiempo de Respuesta */}
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                                <Clock className="mr-2 text-red-400" size={20} />
                                T. Respuesta
                            </h3>
                            <span className={`text-3xl font-bold ${metricas_gruas.resumen.tiempo_respuesta.alerta
                                    ? 'text-red-400'
                                    : 'text-green-400'
                                }`}>
                                {metricas_gruas.resumen.tiempo_respuesta.sin_grua_pct.toFixed(1)}%
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Estado</span>
                                <span className={`font-medium ${metricas_gruas.resumen.tiempo_respuesta.alerta
                                        ? 'text-red-400'
                                        : 'text-green-400'
                                    }`}>
                                    {metricas_gruas.resumen.tiempo_respuesta.alerta ? 'Alerta' : 'Normal'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">Bloques sin grúa con demanda</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Vista Detalle por Grúa */}
            {vistaActiva === 'detalle' && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                            <Settings className="mr-2 text-cyan-400" size={20} />
                            Detalle de Productividad por Grúa
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Grúa
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Movimientos
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Mov/Hora
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Bloques
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                                        Utilización
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {metricas_gruas.detalle_gruas.map((grua) => (
                                    <tr key={grua.grua_id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-medium text-slate-300">Grúa {grua.grua_id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${grua.estado === 'ACTIVA'
                                                    ? 'bg-green-950/50 text-green-400 border border-green-700'
                                                    : 'bg-slate-700 text-slate-400 border border-slate-600'
                                                }`}>
                                                {grua.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                                            {grua.movimientos}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                                            {grua.movimientos_hora.toFixed(1)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                                            {grua.bloques_visitados}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end">
                                                <span className="mr-2 text-sm text-slate-300">{Math.min(grua.utilizacion, 100).toFixed(1)}%</span>
                                                <div className="w-20 bg-slate-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-400"
                                                        style={{ width: `${Math.min(grua.utilizacion, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Vista Matriz COMPLETA */}
            {vistaActiva === 'matriz' && metricas_gruas.matriz_asignacion && (
                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                            <Activity className="mr-2 text-cyan-400" size={20} />
                            Matriz de Asignación Grúa-Bloque-Periodo
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                            Visualización de asignaciones de grúas por bloque y periodo
                        </p>
                    </div>

                    {/* Matriz completa */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-900 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-slate-400 font-medium border-r border-slate-700">
                                        Periodo
                                    </th>
                                    {metricas_gruas.matriz_asignacion.bloques.map(bloque => (
                                        <th
                                            key={bloque}
                                            className="px-4 py-3 text-center text-slate-400 font-medium min-w-[100px] cursor-pointer hover:bg-slate-800"
                                            onClick={() => setSelectedBloque(selectedBloque === bloque ? null : bloque)}
                                        >
                                            {bloque}
                                            {selectedBloque === bloque && (
                                                <span className="block text-xs text-cyan-400 mt-1">Seleccionado</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {metricas_gruas.matriz_asignacion.periodos.map(periodo => (
                                    <tr
                                        key={periodo}
                                        className={`hover:bg-slate-700/30 cursor-pointer ${selectedPeriod === periodo ? 'bg-cyan-900/20' : ''
                                            }`}
                                        onClick={() => setSelectedPeriod(selectedPeriod === periodo ? null : periodo)}
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-300 border-r border-slate-700">
                                            P{periodo}
                                            {selectedPeriod === periodo && (
                                                <span className="ml-2 text-xs text-cyan-400">(seleccionado)</span>
                                            )}
                                        </td>
                                        {metricas_gruas.matriz_asignacion?.bloques?.map(bloque => {
                                            const asignaciones = metricas_gruas.matriz_asignacion?.matriz?.[periodo]?.[bloque] || [];
                                            const isHighlighted = selectedPeriod === periodo || selectedBloque === bloque;

                                            return (
                                                <td
                                                    key={bloque}
                                                    className={`px-4 py-3 text-center ${isHighlighted ? 'bg-slate-700/50' : ''
                                                        } ${selectedPeriod === periodo && selectedBloque === bloque
                                                            ? 'bg-cyan-800/30 ring-2 ring-cyan-500/50'
                                                            : ''
                                                        }`}
                                                >
                                                    {asignaciones.length > 0 ? (
                                                        <div className="flex flex-wrap justify-center gap-1">
                                                            {asignaciones.map((asig, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="relative group"
                                                                >
                                                                    <span
                                                                        className={`inline-block px-2 py-1 rounded text-xs font-medium cursor-help transition-all ${asig.activada
                                                                                ? 'bg-green-950/50 text-green-400 border border-green-700'
                                                                                : 'bg-slate-700 text-slate-400 border border-slate-600'
                                                                            } hover:scale-110`}
                                                                    >
                                                                        G{asig.grua}
                                                                    </span>
                                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                                        <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-slate-700 shadow-lg">
                                                                            <div className="font-semibold border-b border-slate-700 pb-1 mb-1">
                                                                                Grúa {asig.grua}
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400">Movimientos:</span>
                                                                                    <span className="text-cyan-400 font-medium">{asig.movimientos}</span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400">Estado:</span>
                                                                                    <span className={`font-medium ${asig.activada ? 'text-green-400' : 'text-slate-500'
                                                                                        }`}>
                                                                                        {asig.activada ? 'Activada' : 'Inactiva'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400">Periodo:</span>
                                                                                    <span className="text-slate-50">P{periodo}</span>
                                                                                </div>
                                                                                <div className="flex justify-between gap-4">
                                                                                    <span className="text-slate-400">Bloque:</span>
                                                                                    <span className="text-slate-50">{bloque}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                                                            <div className="border-4 border-transparent border-t-slate-900"></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Estadísticas de la matriz */}
                    <div className="p-6 bg-slate-900/50 border-t border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Bloques totales</p>
                                <p className="text-2xl font-bold text-cyan-400">
                                    {metricas_gruas.matriz_asignacion.resumen.bloques_totales}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Periodos totales</p>
                                <p className="text-2xl font-bold text-purple-400">
                                    {metricas_gruas.matriz_asignacion.resumen.periodos_totales}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Total asignaciones</p>
                                <p className="text-2xl font-bold text-green-400">
                                    {metricas_gruas.matriz_asignacion.resumen.asignaciones_totales}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Promedio grúas/periodo</p>
                                <p className="text-2xl font-bold text-amber-400">
                                    {metricas_gruas.matriz_asignacion.resumen.promedio_gruas_periodo.toFixed(1)}
                                </p>
                            </div>
                        </div>

                        {/* Leyenda y controles */}
                        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 bg-green-950/50 text-green-400 border border-green-700 rounded text-xs">
                                        G#
                                    </span>
                                    <span className="text-slate-400">Grúa activa</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block px-2 py-1 bg-slate-700 text-slate-400 border border-slate-600 rounded text-xs">
                                        G#
                                    </span>
                                    <span className="text-slate-400">Grúa inactiva</span>
                                </div>
                            </div>
                            <div className="text-slate-500 text-xs">
                                Haz clic en los periodos o bloques para destacarlos
                            </div>
                        </div>

                        {/* Información de selección */}
                        {(selectedPeriod || selectedBloque) && (
                            <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                                <h5 className="text-sm font-medium text-slate-300 mb-2">Selección actual:</h5>
                                <div className="flex gap-4 text-sm">
                                    {selectedPeriod && (
                                        <div>
                                            <span className="text-slate-400">Periodo:</span>
                                            <span className="ml-2 font-medium text-cyan-400">P{selectedPeriod}</span>
                                        </div>
                                    )}
                                    {selectedBloque && (
                                        <div>
                                            <span className="text-slate-400">Bloque:</span>
                                            <span className="ml-2 font-medium text-cyan-400">{selectedBloque}</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSelectedPeriod(null);
                                            setSelectedBloque(null);
                                        }}
                                        className="ml-auto text-xs text-slate-500 hover:text-slate-300"
                                    >
                                        Limpiar selección
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GruasAnalysis;