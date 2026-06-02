// src/components/camila/components/KPIGrid.tsx

import React from 'react';
import {
    TrendingUp, Package, BarChart3, Clock,
    ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
    Activity, Target, Users, Grid3x3
} from 'lucide-react';
import type { DashboardEjecutivoResponse } from '../../../types/camila';

interface Props {
    data: DashboardEjecutivoResponse;
}

const KPIGrid: React.FC<Props> = ({ data }) => {
    // Validación inicial
    if (!data?.tabs?.vista_general) {
        return (
            <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
                <AlertCircle className="mx-auto text-amber-400 mb-4" size={48} />
                <p className="text-slate-400">No hay datos disponibles para mostrar</p>
            </div>
        );
    }

    const { vista_general } = data.tabs;

    // Validaciones de datos críticos
    if (!vista_general.kpis_principales || !vista_general.distribucion_flujos || !vista_general.utilizacion_recursos) {
        return (
            <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
                <AlertCircle className="mx-auto text-amber-400 mb-4" size={48} />
                <p className="text-slate-400">Datos incompletos</p>
                <p className="text-sm text-slate-500 mt-2">
                    Los datos del dashboard están incompletos. Por favor, verifica la configuración.
                </p>
            </div>
        );
    }

    // Funciones auxiliares
    const getProductividadColor = (valor: number) => {
        if (valor >= 75) return 'text-green-400';
        if (valor >= 60) return 'text-amber-400';
        return 'text-red-400';
    };

    const getBalanceIcon = (balance: number) => {
        if (balance > 50) return <ArrowUpRight className="text-green-400" size={20} />;
        if (balance < -50) return <ArrowDownRight className="text-red-400" size={20} />;
        return <Minus className="text-amber-400" size={20} />;
    };

    const getPrecisionColor = (categoria: string) => {
        switch (categoria) {
            case 'EXCELENTE': return 'text-green-400';
            case 'BUENO': return 'text-cyan-400';
            case 'REGULAR': return 'text-amber-400';
            default: return 'text-red-400';
        }
    };

    // Verificar si es vista agregada (sin turno específico)
    const isAggregatedView = !data.metadata.turno;

    // Valores por defecto para evitar errores
    const defaultKpis = {
        productividad: vista_general.kpis_principales?.productividad || {
            valor: 0,
            unidad: 'cont/hora',
            meta: 75,
            cumplimiento_meta: 0,
            estado: 'BAJO' as const
        },
        precision_modelo: vista_general.kpis_principales?.precision_modelo || {
            valor: 0,
            unidad: '%',
            categoria: 'SIN_DATOS' as const,
            score_coincidencia: 0
        },
        balance_flujos: vista_general.kpis_principales?.balance_flujos || {
            entradas: 0,
            salidas: 0,
            balance: 0,
            categoria: 'Sin datos',
            alerta: false
        },
        ahorro_distancia: vista_general.kpis_principales?.ahorro_distancia || null
    };

    const defaultDistribucion = {
        carga: vista_general.distribucion_flujos?.carga || 0,
        descarga: vista_general.distribucion_flujos?.descarga || 0,
        entrega: vista_general.distribucion_flujos?.entrega || 0,
        recepcion: vista_general.distribucion_flujos?.recepcion || 0,
        total: vista_general.distribucion_flujos?.total || 1 // Evitar división por cero
    };

    const defaultUtilizacion = {
        gruas: vista_general.utilizacion_recursos?.gruas || {
            total: 0,
            utilizadas: 0,
            porcentaje: 0
        },
        bloques: vista_general.utilizacion_recursos?.bloques || {
            mas_utilizado: 'N/A',
            concentracion_maxima: 0,
            distribucion_balanceada: false
        }
    };

    return (
        <div className="space-y-6">
            {/* KPIs Principales - Primera fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Productividad */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-sm">
                                {isAggregatedView ? 'Productividad Promedio' : 'Productividad'}
                            </p>
                            <p className={`text-3xl font-bold mt-1 ${getProductividadColor(defaultKpis.productividad.valor)}`}>
                                {defaultKpis.productividad.valor}
                            </p>
                            <p className="text-slate-400 text-sm">cont/hora</p>
                        </div>
                        <div className="bg-slate-700 p-3 rounded-lg">
                            <TrendingUp size={20} className="text-green-400" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Meta: {defaultKpis.productividad.meta}</span>
                        <span className={`text-sm font-medium ${defaultKpis.productividad.estado === 'BUENO'
                            ? 'text-green-400'
                            : 'text-red-400'
                            }`}>
                            {defaultKpis.productividad.cumplimiento_meta}%
                        </span>
                    </div>
                </div>

                {/* Precisión del Modelo */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-sm">Precisión Modelo</p>
                            <p className={`text-3xl font-bold mt-1 ${getPrecisionColor(defaultKpis.precision_modelo.categoria)
                                }`}>
                                {defaultKpis.precision_modelo.valor}%
                            </p>
                            <p className="text-slate-400 text-sm">coincidencia</p>
                        </div>
                        <div className="bg-slate-700 p-3 rounded-lg">
                            <BarChart3 size={20} className="text-cyan-400" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            Score: {defaultKpis.precision_modelo.score_coincidencia}%
                        </span>
                        <span className={`text-sm font-medium ${getPrecisionColor(defaultKpis.precision_modelo.categoria)
                            }`}>
                            {defaultKpis.precision_modelo.categoria}
                        </span>
                    </div>
                </div>

                {/* Balance de Flujos */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-sm">Balance Flujos</p>
                            <p className={`text-3xl font-bold mt-1 ${Math.abs(defaultKpis.balance_flujos.balance) > 200
                                ? 'text-red-400'
                                : 'text-green-400'
                                }`}>
                                {defaultKpis.balance_flujos.balance > 0 ? '+' : ''}
                                {defaultKpis.balance_flujos.balance}
                            </p>
                            <p className="text-slate-400 text-sm">contenedores</p>
                        </div>
                        <div className="bg-slate-700 p-3 rounded-lg">
                            {getBalanceIcon(defaultKpis.balance_flujos.balance)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                            E: {defaultKpis.balance_flujos.entradas} |
                            S: {defaultKpis.balance_flujos.salidas}
                        </span>
                        {defaultKpis.balance_flujos.alerta && (
                            <span className="text-xs text-red-400">⚠ Alerta</span>
                        )}
                    </div>
                </div>

                {/* Ahorro de Distancia */}
                {defaultKpis.ahorro_distancia && (
                    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-slate-400 text-sm">Ahorro Distancia</p>
                                <p className="text-3xl font-bold mt-1 text-purple-400">
                                    {defaultKpis.ahorro_distancia.metros.toLocaleString()}
                                </p>
                                <p className="text-slate-400 text-sm">metros</p>
                            </div>
                            <div className="bg-slate-700 p-3 rounded-lg">
                                <Target size={20} className="text-purple-400" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Reducción: {defaultKpis.ahorro_distancia.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Distribución de Flujos */}
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                    <Package className="mr-2 text-cyan-400" size={20} />
                    Distribución de Operaciones
                    {isAggregatedView && (
                        <span className="ml-2 text-sm font-normal text-slate-300">
                            (Total semana)
                        </span>
                    )}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { tipo: 'Carga', valor: defaultDistribucion.carga, color: 'bg-blue-500' },
                        { tipo: 'Descarga', valor: defaultDistribucion.descarga, color: 'bg-purple-500' },
                        { tipo: 'Entrega', valor: defaultDistribucion.entrega, color: 'bg-orange-500' },
                        { tipo: 'Recepción', valor: defaultDistribucion.recepcion, color: 'bg-green-500' }
                    ].map(flujo => {
                        const porcentaje = defaultDistribucion.total > 0
                            ? (flujo.valor / defaultDistribucion.total) * 100
                            : 0;

                        return (
                            <div key={flujo.tipo} className="text-center">
                                <div className="relative w-24 h-24 mx-auto mb-2">
                                    <svg className="transform -rotate-90 w-24 h-24">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="36"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-slate-700"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="36"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 36}`}
                                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - porcentaje / 100)}`}
                                            className={flujo.color.replace('bg-', 'text-')}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xl font-bold text-slate-50">{flujo.valor}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-300">{flujo.tipo}</p>
                                <p className="text-xs text-slate-500">
                                    {porcentaje.toFixed(1)}%
                                </p>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 text-center text-sm text-slate-400">
                    Total: {defaultDistribucion.total.toLocaleString()} contenedores
                </div>
            </div>

            {/* Utilización de Recursos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                        <Users className="mr-2 text-amber-400" size={20} />
                        Utilización de Grúas
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-3xl font-bold text-green-400">
                                {defaultUtilizacion.gruas.utilizadas}/
                                {defaultUtilizacion.gruas.total}
                            </p>
                            <p className="text-sm text-slate-300">grúas activas</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-50">
                                {defaultUtilizacion.gruas.porcentaje}%
                            </p>
                            <p className="text-sm text-slate-300">utilización</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${defaultUtilizacion.gruas.porcentaje}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
                        <Grid3x3 className="mr-2 text-cyan-400" size={20} />
                        Concentración en Bloques
                    </h3>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-3xl font-bold text-cyan-400">
                                {defaultUtilizacion.bloques.mas_utilizado}
                            </p>
                            <p className="text-sm text-slate-300">bloque más usado</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-slate-50">
                                {defaultUtilizacion.bloques.concentracion_maxima}%
                            </p>
                            <p className="text-sm text-slate-300">concentración</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Distribución</span>
                        <span className={`font-medium ${defaultUtilizacion.bloques.distribucion_balanceada
                            ? 'text-green-400'
                            : 'text-amber-400'
                            }`}>
                            {defaultUtilizacion.bloques.distribucion_balanceada
                                ? 'Balanceada'
                                : 'Concentrada'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KPIGrid;