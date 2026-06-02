// src/components/camila/CamilaPanel.tsx

import React, { useState, useEffect } from 'react';
import {
    Activity, TrendingUp, BarChart3, Settings,
    Download, RefreshCw, AlertCircle
} from 'lucide-react';
import { useCamilaDashboard, useFiltrosDisponibles } from '../../hooks/useCamilaData';
import { useOptimizationModelContext } from '../../contexts/OptimizationModelContext';
import type { CamilaConfig } from '../../types/camila';

// Componentes del dashboard
import KPIGrid from './views/KPIGrid';
import ComparisonView from './views/ComparisonView';
import GruasAnalysis from './views/GruasAnalysis';
import ModelConfigSelector from './selectors/ModelConfigSelector';

const CamilaPanel: React.FC = () => {
    const [activeView, setActiveView] = useState<'kpis' | 'comparison' | 'gruas'>('kpis');
    const { data: filtros, loading: loadingFiltros } = useFiltrosDisponibles();
    const { config: optConfig } = useOptimizationModelContext();

    const [config, setConfig] = useState<CamilaConfig | null>(null);

    // Inicializar configuración cuando se cargan los filtros
    useEffect(() => {
        if (filtros && !config) {
            const availableYears = filtros.anios || [2022];
            const defaultYear = availableYears.length > 0 ? availableYears[0] : 2022;

            setConfig({
                anio: defaultYear,
                semana: filtros.semanas?.[0] || 1,
                participacion: filtros.participaciones?.[0] || 68,
                turno: filtros.turnos?.[0] || 1,
                variant: optConfig.variant || 'magdalena'
            });
        }
    }, [filtros, config, optConfig.variant]);

    const { data, loading, error } = useCamilaDashboard(config);

    const views = [
        { id: 'kpis', label: 'KPIs Ejecutivos', icon: Activity },
        { id: 'comparison', label: 'Modelo vs Real', icon: TrendingUp },
        { id: 'gruas', label: 'Análisis Grúas', icon: Settings }
    ];

    if (loadingFiltros || !filtros || !config) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Cargando configuración...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="mt-4 text-slate-400">Cargando dashboard ejecutivo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-950/30 border border-red-700 rounded-lg p-8 max-w-md w-full">
                    <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-red-400 text-center mb-2">Error al cargar datos</h3>
                    <p className="text-red-400 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Header Principal */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-50">
                                    Dashboard Ejecutivo - Terminal DP World
                                </h1>
                                {data && (
                                    <p className="text-sm text-slate-300 mt-1">
                                        {config.anio} • Semana {data.metadata.semana} •
                                        {config.turno ? ` Turno ${data.metadata.turno}` : ' Todos los turnos'} •
                                        Participación {data.metadata.participacion}%
                                    </p>
                                )}
                            </div>

                        </div>

                        {/* Selector de configuración */}
                        <div className="mt-4">
                            <ModelConfigSelector
                                config={config}
                                onChange={setConfig}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Navegación de vistas */}
            <nav className="bg-slate-800/50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-1 py-2">
                        {views.map(view => {
                            const Icon = view.icon;
                            return (
                                <button
                                    key={view.id}
                                    onClick={() => setActiveView(view.id as any)}
                                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${activeView === view.id
                                            ? 'bg-cyan-600 text-white'
                                            : 'text-slate-400 hover:text-slate-50 hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon size={20} className="mr-2" />
                                    {view.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {data && (
                    <>
                        {activeView === 'kpis' && <KPIGrid data={data} />}
                        {activeView === 'comparison' && <ComparisonView data={data} />}
                        {activeView === 'gruas' && <GruasAnalysis data={data} />}
                    </>
                )}
            </main>
        </div>
    );
};

export default CamilaPanel;