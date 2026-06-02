// frontend/src/components/camila/views/AnalisisBloques.tsx

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Treemap, Cell
} from 'recharts';
import { Grid3x3, AlertTriangle, TrendingUp, Filter } from 'lucide-react';
import type { AnalisisBloques as AnalisisBloquesType } from '../../../types/camila';

interface AnalisisBloquesProps {
    data: AnalisisBloquesType;
}

// Componente personalizado para el contenido del Treemap
const CustomTreemapContent: React.FC<any> = ({ x, y, width, height, name, porcentaje, fill }) => {
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{ fill, stroke: '#1e293b', strokeWidth: 2 }}
            />
            {width > 50 && height > 30 && (
                <>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 - 8}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize={14}
                        fontWeight="bold"
                    >
                        {name}
                    </text>
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 8}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize={12}
                    >
                        {porcentaje?.toFixed(1)}%
                    </text>
                </>
            )}
        </g>
    );
};

export const AnalisisBloques: React.FC<AnalisisBloquesProps> = ({ data }) => {
    const [vistaSeleccionada, setVistaSeleccionada] = useState<'barras' | 'treemap'>('barras');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'carga' | 'descarga' | 'entrega' | 'recepcion'>('todos');

    const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

    // Preparar datos para gráfico de barras
    const datosBarras = data.distribucion.map(bloque => {
        if (filtroTipo === 'todos') {
            return {
                bloque: bloque.bloque,
                modelo: bloque.movimientos_total,
                real: bloque.comparacion?.real || 0,
                diferencia: bloque.comparacion?.diferencia || 0
            };
        } else {
            return {
                bloque: bloque.bloque,
                valor: bloque.desglose[filtroTipo],
                porcentaje: ((bloque.desglose[filtroTipo] / bloque.movimientos_total) * 100).toFixed(1)
            };
        }
    });

    // Preparar datos para treemap
    const datosTreemap = data.distribucion.map((bloque, index) => ({
        name: bloque.bloque,
        size: bloque.movimientos_total,
        porcentaje: bloque.porcentaje,
        fill: COLORS[index % COLORS.length]
    }));

    // Estilos para el tooltip de Recharts
    const tooltipStyle = {
        backgroundColor: '#1e293b',
        border: '1px solid #475569',
        borderRadius: '8px',
        padding: '8px'
    };

    const tooltipItemStyle = {
        color: '#cbd5e1'
    };

    return (
        <div className="space-y-6">
            {/* Header con controles */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-50 flex items-center">
                    <Grid3x3 className="mr-2 text-cyan-400" size={20} />
                    Análisis por Bloques
                </h3>

                <div className="flex items-center space-x-4">
                    {/* Selector de tipo de flujo */}
                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value as any)}
                            className="bg-slate-700 border border-slate-600 text-slate-50 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="todos">Todos los flujos</option>
                            <option value="carga">Solo Carga</option>
                            <option value="descarga">Solo Descarga</option>
                            <option value="entrega">Solo Entrega</option>
                            <option value="recepcion">Solo Recepción</option>
                        </select>
                    </div>

                    {/* Selector de vista */}
                    <div className="flex bg-slate-700 rounded">
                        <button
                            onClick={() => setVistaSeleccionada('barras')}
                            className={`px-3 py-1 text-sm rounded-l transition-colors ${vistaSeleccionada === 'barras'
                                ? 'bg-cyan-600 text-white'
                                : 'text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Barras
                        </button>
                        <button
                            onClick={() => setVistaSeleccionada('treemap')}
                            className={`px-3 py-1 text-sm rounded-r transition-colors ${vistaSeleccionada === 'treemap'
                                ? 'bg-cyan-600 text-white'
                                : 'text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Treemap
                        </button>
                    </div>
                </div>
            </div>

            {/* Bloques críticos */}
            {data.bloques_criticos.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Bloques Críticos Detectados
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.bloques_criticos.map((critico, index) => (
                            <div key={index} className="bg-amber-950/50 rounded p-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-amber-300">{critico.bloque}</span>
                                    <span className="text-xs bg-amber-800 text-amber-200 px-2 py-1 rounded">
                                        {critico.problema === 'SOBRE_UTILIZADO' ? 'Sobrecarga' : 'Discrepancia'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 mt-1">
                                    {critico.problema === 'SOBRE_UTILIZADO'
                                        ? `${critico.porcentaje?.toFixed(1)}% de actividad`
                                        : `${Math.abs(critico.diferencia || 0)}% diferencia`
                                    }
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Visualización principal */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                {vistaSeleccionada === 'barras' ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={datosBarras}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="bloque" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1" />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                            />
                            {filtroTipo === 'todos' ? (
                                <>
                                    <Legend />
                                    <Bar dataKey="modelo" fill="#10b981" name="Modelo" />
                                    <Bar dataKey="real" fill="#06b6d4" name="Real" />
                                </>
                            ) : (
                                <Bar dataKey="valor" fill="#10b981" name={filtroTipo.charAt(0).toUpperCase() + filtroTipo.slice(1)} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <Treemap
                            data={datosTreemap}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#1e293b"
                            content={<CustomTreemapContent />}
                        />
                    </ResponsiveContainer>
                )}
            </div>

            {/* Top 3 Bloques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.top_3_bloques.map((bloque, index) => (
                    <div key={bloque.bloque} className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-slate-50">#{index + 1} {bloque.bloque}</h4>
                            <TrendingUp className="text-cyan-400" size={20} />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <p className="text-3xl font-bold text-cyan-400">{bloque.movimientos_total.toLocaleString()}</p>
                                <p className="text-sm text-slate-300">movimientos totales</p>
                            </div>

                            <div className="pt-3 border-t border-slate-700">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-slate-400">Carga:</span>
                                        <span className="ml-2 text-slate-300">{bloque.desglose.carga}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Descarga:</span>
                                        <span className="ml-2 text-slate-300">{bloque.desglose.descarga}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Entrega:</span>
                                        <span className="ml-2 text-slate-300">{bloque.desglose.entrega}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Recepción:</span>
                                        <span className="ml-2 text-slate-300">{bloque.desglose.recepcion}</span>
                                    </div>
                                </div>
                            </div>

                            {bloque.comparacion && (
                                <div className="pt-3 border-t border-slate-700">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-400">vs Real</span>
                                        <span className={`text-sm font-medium ${Math.abs(bloque.comparacion.diferencia_pct) < 10
                                            ? 'text-green-400'
                                            : 'text-amber-400'
                                            }`}>
                                            {bloque.comparacion.diferencia > 0 ? '+' : ''}{bloque.comparacion.diferencia_pct.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Matriz de comparación visual */}
            {data.comparacion_visual && (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h4 className="text-lg font-semibold text-slate-50 mb-4">
                        Comparación Visual Modelo vs Real
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.comparacion_visual.bloques.map((bloque, i) => ({
                            bloque,
                            modelo: data.comparacion_visual.modelo[i],
                            real: data.comparacion_visual.real[i],
                            diferencia: data.comparacion_visual.diferencias[i]
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                            <XAxis dataKey="bloque" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1" />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                            />
                            <Legend />
                            <Bar dataKey="modelo" fill="#10b981" name="Modelo" />
                            <Bar dataKey="real" fill="#06b6d4" name="Real" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AnalisisBloques;