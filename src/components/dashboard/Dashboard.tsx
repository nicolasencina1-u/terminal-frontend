// src/components/dashboard/Dashboard.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPanel } from './MapPanel';
import { CorePortKPIPanel } from './CorePortKPIPanel';
import { CongestionAnalyticsPanel } from './CongestionAnalyticsPanel';
import { TimeControl } from '../shared/TimeControl';
import { OptimizationKPIPanel } from '../optimization/OptimizationKPIPanel';
import OptimizationComparisonPanel from '../optimization/ComparisonPanel';
import CamilaPanel from '../camila/CamilaPanel';
import PatioView from '../map/views/PatioView';
import { usePortData } from '../../hooks/usePortData';
import { useFilters } from '../../hooks/useFilters';
import { useTimeContext } from '../../contexts/TimeContext';
import { useOptimizationModelContext } from '../../contexts/OptimizationModelContext';
import { useViewNavigation } from '../../contexts/ViewNavigationContext';
import { usePortKPIs } from '../../hooks/usePortKPIs';
import { useRealPatioData } from '../../hooks/useRealPatioData';
import { patioData } from '../../data/patioData';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  Clock,
  Calendar,
  User,
  Settings,
  MapPin,
  AlertTriangle,
  Package,
  TrendingUp
} from 'lucide-react';
import { DataSourceSelector } from '../shared/DataSourceSelector';

import { useOptimizationData } from '../../hooks/useOptimizationData';

import {  getISOWeekNumber, getISOYear } from '../../utils/isoWeekUtils';

import { useCamilaDashboard } from '../../hooks/useCamilaData';
import type { comparisonSource } from '../map/views/patio/patioDataHelpers';

import {ComparisonSourceSelector} from '../../components/shared/Selector'

interface DashboardProps {
  portDataPath?: string;
  blockCapacities?: Record<string, number>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  blockCapacities
}) => {
  const [activeTab, setActiveTab] = useState('operativo');
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [showOptimizationDetail, setShowOptimizationDetail] = useState(false);
  const [showCamilaDetail, setShowCamilaDetail] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    console.log('showAnalytics:', showAnalytics);
  }, [showAnalytics]);

  const { getColorForOcupacion } = usePortData();
  const { filters, toggleFilter } = useFilters();
  const { timeState, isLoadingData } = useTimeContext();
  const { config: optimizationConfig, activeModel, updateConfig } = useOptimizationModelContext();
  const { viewState } = useViewNavigation();

  // Hooks para datos reales
  const { currentKPIs, getStatusForKPI } = usePortKPIs();
  const { patioData: realPatioData } = useRealPatioData();

  const isInCostanera = useMemo(() => {
    return (
      viewState.level === 'patio' &&
      viewState.selectedPatio?.toLowerCase() === 'costanera'
    ) || (
        viewState.level === 'bloque' &&
        viewState.selectedPatio?.toLowerCase() === 'costanera'
      );
  }, [viewState.level, viewState.selectedPatio]);

  const isOptimizationActive = useMemo(() => {
    const ds = timeState?.dataSource?.toLowerCase() || '';
    return ['magdalena', 'pipeline', 'econstraint', 'e-constraint'].includes(ds) && isInCostanera;
  }, [timeState?.dataSource, isInCostanera]);

  const isCamilaActive = useMemo(() => {
    return timeState?.dataSource === 'modelCamila' && isInCostanera;
  }, [timeState?.dataSource, isInCostanera]);


  const currentPatio = useMemo(() => {
    return patioData.find(p => p.id === viewState.selectedPatio);
  }, [viewState.selectedPatio]);

  const formatName = (name: string | undefined | null) => {
    if (!name) return '';
    if (name.toLowerCase() === 'e-constraint') return 'E-Constraint';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const activeModelFormatted = formatName(activeModel);
  const selectedPatioFormatted = formatName(viewState.selectedPatio);

  const currentISOYear = useMemo(()=>getISOYear(timeState.currentDate),[timeState.currentDate]);
  const currentISOWeek = useMemo(()=>getISOWeekNumber(timeState.currentDate),[timeState.currentDate]);

  const { metrics: optimizationMetrics, isLoading: isLoadingOptimization } = useOptimizationData(
    optimizationConfig,
    undefined,
    undefined,
    undefined
  );

  const toggleMenu = useCallback(() => {
    setIsMenuCollapsed(prev => !prev);
  }, []);

  const camilaConfig = useMemo(()=>({
    anio: currentISOYear,
    semana: currentISOWeek,
    participacion: 50,
  }), [currentISOWeek, currentISOYear]);

  const{
    data: camilaData,
    loading: isLoading,
    error: camilaError
  } = useCamilaDashboard(isCamilaActive ? camilaConfig : null);

  const [isComparisonEnabled, setComparisonEnabled] = useState(false);
  const [comparisonTarget, setComparisonTarget] = useState<comparisonSource>('historico');

  // Reglas de transición de estado para la comparación
  useEffect(() => {
    const ds = timeState.dataSource?.toLowerCase();
    
    if (ds === 'historical') {
      setComparisonEnabled(false);
      setComparisonTarget('magdalena');
    } else if (['magdalena', 'pipeline', 'econstraint', 'e-constraint'].includes(ds)) {
      setComparisonEnabled(true);
      setComparisonTarget('historico');
    }
  }, [timeState.dataSource]);

  // Hook para cargar las métricas de comparación si el target es un modelo diferente al activo
  const comparisonConfig = useMemo(() => {
    if (!isComparisonEnabled || comparisonTarget === 'historico') return null;
    
    // Mapeo de target a variante
    const variantMap: Record<string, string> = {
      'magdalena': 'magdalena',
      'pipeline': 'pipeline',
      'e-constraint': 'econstraint'
    };
    
    const targetVariant = variantMap[comparisonTarget];
    
    // Si el target es el mismo que el activo, no necesitamos una segunda carga
    if (isOptimizationActive && targetVariant === optimizationConfig.variant) {
      return null;
    }

    return {
      ...optimizationConfig,
      variant: targetVariant
    };
  }, [isComparisonEnabled, comparisonTarget, isOptimizationActive, optimizationConfig]);

  const { metrics: referenceMetricsFromHook } = useOptimizationData(
    comparisonConfig || optimizationConfig, // Usar el activo como fallback (se servirá del caché)
    undefined,
    undefined,
    undefined
  );

  const referenceMetrics = useMemo(() => {
    if (!isComparisonEnabled) return null;
    
    if (comparisonTarget === 'historico') return optimizationMetrics;

    const variantMap: Record<string, string> = {
      'magdalena': 'magdalena',
      'pipeline': 'pipeline',
      'e-constraint': 'econstraint'
    };
    if (isOptimizationActive && variantMap[comparisonTarget] === optimizationConfig.variant) {
      return optimizationMetrics;
    }

    return referenceMetricsFromHook;
  }, [isComparisonEnabled, comparisonTarget, isOptimizationActive, optimizationConfig.variant, optimizationMetrics, referenceMetricsFromHook]);

  useEffect(() => {
    if (timeState.dataSource === 'historical' && isComparisonEnabled && comparisonTarget !== 'historico') {
      const variantMap: Record<string, string> = {
        'magdalena': 'magdalena',
        'pipeline': 'pipeline',
        'e-constraint': 'econstraint'
      };
      const variant = variantMap[comparisonTarget];
      if (variant && optimizationConfig.variant !== variant) {
        updateConfig({ variant });
      }
    }
  }, [timeState.dataSource, isComparisonEnabled, comparisonTarget, optimizationConfig.variant, updateConfig]);

  useEffect(() => {
    const ds = timeState.dataSource?.toLowerCase();
    const isSame = (ds === 'historical' && comparisonTarget === 'historico') ||
      (ds === 'magdalena' && comparisonTarget === 'magdalena') ||
      (ds === 'pipeline' && comparisonTarget === 'pipeline') ||
      (ds === 'econstraint' && comparisonTarget === 'e-constraint') ||
      (ds === 'e-constraint' && comparisonTarget === 'e-constraint');

    if (isSame) {
      if (ds === 'historical') {
        setComparisonTarget('magdalena');
      } else {
        setComparisonTarget('historico');
      }
    }
  }, [timeState.dataSource, comparisonTarget]);


  const showDataSelector = (
    viewState.level === 'patio' &&
    viewState.selectedPatio?.toLowerCase() === 'costanera'
  ) || (
      viewState.level === 'bloque' &&
      viewState.selectedPatio?.toLowerCase() === 'costanera'
    );


  // Calcular estado de congestión basado en los KPIs
  const getCongestionStatus = useCallback(() => {
    if (!currentKPIs) return { gates: 'normal', patios: 'normal', muelles: 'normal', global: 0 };

    // Gates: basado en flujo promedio y tiempo de camiones
    const gateFlow = currentKPIs.flujoPromedioGates || 0;
    const ttt = currentKPIs.tiempoCamiones?.promedio || 0;
    let gateStatus = 'good';
    if (gateFlow < 30 || ttt > 90) gateStatus = 'warning';
    if (gateFlow < 20 || ttt > 120) gateStatus = 'critical';

    // Patios: basado en movimientos internos (menos es mejor)
    const patioMov = currentKPIs.movimientosPatioHora || 0;
    let patioStatus = 'good';
    if (patioMov > 50) patioStatus = 'warning';
    if (patioMov > 70) patioStatus = 'critical';

    // Muelles: basado en movimientos de muelle
    const muelleMov = currentKPIs.movimientosMuelleHora || 0;
    let muelleStatus = 'good';
    if (muelleMov < 30) muelleStatus = 'warning';
    if (muelleMov < 20) muelleStatus = 'critical';

    // Índice global (0-100)
    const globalIndex =
      (gateStatus === 'critical' ? 70 : gateStatus === 'warning' ? 40 : 20) +
      (patioStatus === 'critical' ? 20 : patioStatus === 'warning' ? 10 : 5) +
      (muelleStatus === 'critical' ? 10 : muelleStatus === 'warning' ? 5 : 0);

    return {
      gates: gateStatus,
      patios: patioStatus,
      muelles: muelleStatus,
      global: globalIndex
    };
  }, [currentKPIs]);

  const congestionStatus = getCongestionStatus();

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'good': return '🟢';
      case 'warning': return '🟡';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  // Obtener label temporal
  const getTemporalLabel = () => {
    switch (timeState.unit) {
      case 'week': return 'Promedio Semanal';
      case 'day': return 'Total del Día';
      case 'shift': return `Turno ${new Date(timeState.currentDate).getHours() >= 8 && new Date(timeState.currentDate).getHours() < 16 ? 1 : new Date(timeState.currentDate).getHours() >= 16 ? 2 : 3}`;
      case 'hour': return `Hora ${new Date(timeState.currentDate).getHours()}:00`;
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* HEADER */}
      <header className="bg-blue-900 text-white py-2 px-4 shadow-md flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Terminal Operation System - DP World</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock size={20} />
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={20} />
              <span>{new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
            <div className="border-l pl-6 flex items-center space-x-2">
              <User size={20} />
              <span>Operador</span>
              <span className="bg-blue-700 text-xs px-2 py-0.5 rounded-full">Terminal</span>
            </div>
            <Settings size={20} className="cursor-pointer hover:text-blue-200 transition-colors" />
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        {!isMenuCollapsed ? (
          <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col h-full flex-shrink-0">
            {/* Header del sidebar */}
            <div className="flex-shrink-0 p-4 border-b border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-100">Panel de Control</h3>
                <button
                  onClick={toggleMenu}
                  className="p-1 rounded hover:bg-slate-700 transition-colors"
                >
                  <ChevronLeft size={20} className="text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-400">
                {showDataSelector ? 'Patio Costanera - Opciones Avanzadas' : 'Configuración General'}
              </p>
            </div>

            {/* Contenido del sidebar con scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Estado actual */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <MapPin size={16} className="mr-1" />
                    Vista Actual
                  </h4>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Nivel: <span className="font-mono font-medium">{viewState.level}</span></div>
                    {viewState.selectedPatio && (
                      <div>Patio: <span className="font-mono font-medium">{selectedPatioFormatted}</span></div>
                    )}
                    {viewState.selectedBloque && (
                      <div>Bloque: <span className="font-mono font-medium">{viewState.selectedBloque}</span></div>
                    )}
                    <div className="mt-2 text-cyan-400">
                      {getTemporalLabel()}
                    </div>
                  </div>
                  {showDataSelector && (
                    <div className="mt-2 text-xs text-green-400 bg-green-900/30 rounded p-2">
                      ✅ Opciones de modelos disponibles
                    </div>
                  )}
                </div>

                {/* Panel de Congestión del Terminal */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                    <TrendingUp size={16} className="mr-1" />
                    Estado de Congestión
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-400">Gates:</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium mr-2 ${getStatusColor(congestionStatus.gates)}`}>
                          {congestionStatus.gates === 'good' ? 'Fluido' :
                            congestionStatus.gates === 'warning' ? 'Moderado' : 'Crítico'}
                        </span>
                        <span>{getStatusEmoji(congestionStatus.gates)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-400">Patios:</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium mr-2 ${getStatusColor(congestionStatus.patios)}`}>
                          {congestionStatus.patios === 'good' ? 'Normal' :
                            congestionStatus.patios === 'warning' ? 'Moderado' : 'Alto'}
                        </span>
                        <span>{getStatusEmoji(congestionStatus.patios)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-400">Muelles:</span>
                      <div className="flex items-center">
                        <span className={`text-sm font-medium mr-2 ${getStatusColor(congestionStatus.muelles)}`}>
                          {congestionStatus.muelles === 'good' ? 'Normal' :
                            congestionStatus.muelles === 'warning' ? 'Lento' : 'Crítico'}
                        </span>
                        <span>{getStatusEmoji(congestionStatus.muelles)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-600 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Índice Global:</span>
                        <span className={`text-sm font-bold ${congestionStatus.global < 30 ? 'text-green-400' :
                          congestionStatus.global < 60 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                          {congestionStatus.global}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ocupación por Patio */}
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                    <Package size={16} className="mr-1" />
                    Ocupación de Patios
                  </h4>
                  <div className="space-y-2">
                    {realPatioData && realPatioData
                      .filter(patio => patio.id !== 'imo' && patio.id !== 'espingon')
                      .map(patio => {
                        const ocupacion = patio.ocupacionTotal || 0;
                        const barWidth = `${Math.min(ocupacion, 100)}%`;
                        const color = ocupacion < 70 ? 'bg-green-500' :
                          ocupacion < 85 ? 'bg-yellow-500' : 'bg-red-500';

                        return (
                          <div key={patio.id} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 capitalize">{patio.name}:</span>
                              <span className="font-medium text-slate-200">{ocupacion.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${color}`}
                                style={{ width: barWidth }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {/* Resumen */}
                  {currentKPIs && (
                    <div className="mt-3 pt-2 border-t border-slate-600 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Capacidad Total:</span>
                        <span className="text-slate-300">{currentKPIs.capacidadTotal?.toLocaleString()} TEUs</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>TEUs Actuales:</span>
                        <span className="text-slate-300">{currentKPIs.promedioTeus?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selector de datos */}
                {showDataSelector && (
                  <div className="pt-4 border-t border-slate-700 mt-2">
                    <ComparisonSourceSelector
                      isEnabled={isComparisonEnabled}
                      onToggle={setComparisonEnabled}
                      value={comparisonTarget}
                      onChange={setComparisonTarget}
                      activeSource={timeState.dataSource}
                    />
                    <div className="mt-3">
                      <DataSourceSelector/>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        ) : (
          // Sidebar colapsado
          <div className="w-16 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-4 h-full flex-shrink-0">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={20} className="text-slate-400" />
            </button>
          </div>
        )}

        {/* AREA PRINCIPAL DE CONTENIDO */}
        <main className="flex-1 overflow-hidden">
          {/* VISTA TERMINAL: Solo Mapa en pantalla completa */}
          {viewState.level === 'terminal' && (
            <MapPanel
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filters={filters}
              getColorForOcupacion={getColorForOcupacion}
              timeState={timeState}
              isLoading={isLoadingData}
              blockCapacities={blockCapacities}
              optimizationResult={optimizationMetrics}
              isCamilaActive={isCamilaActive}
              camilaData={camilaData}
              referenceMetrics={referenceMetrics}
              comparisonType={comparisonTarget}
              isComparisonEnabled={isComparisonEnabled}
            />
          )}

          {/* VISTA PATIO: LAYOUT CON SCROLL PARA ANALISIS DETALLADO */}
          {viewState.level === 'patio' && (
            <div className="h-full overflow-y-auto bg-slate-900">
              {/* TimeControl para datos historicos */}
              {timeState.dataSource === 'historical' && (
                <div className="sticky top-0 z-20 p-4 bg-slate-900 border-b border-slate-700">
                  <TimeControl className="w-full" />
                </div>
              )}

              {/* INDICADOR DE MODELO ACTIVO */}
              {(isOptimizationActive || isCamilaActive) && (
                <div className="sticky top-0 z-20 p-4 bg-slate-900 border-b border-slate-700">
                  {isOptimizationActive && (
                    <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border-2 border-green-700 rounded-xl px-6 py-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-pulse"></div>
                          <div>
                            <span className="text-lg font-bold text-green-400 capitalize">
                              🔮 Modelo {activeModelFormatted} Activo
                            </span>
                            <div className="text-sm text-green-300 mt-1">
                              {selectedPatioFormatted} • Semana {optimizationConfig.semana} •
                              Participación {optimizationConfig.participacion}% •
                              {optimizationConfig.conDispersion ? 'Con Dispersión' : 'Sin Dispersión'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {/* Botón de Análisis Optimización */}
                          <button
                            onClick={() => setShowOptimizationDetail(!showOptimizationDetail)}
                            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg ${showOptimizationDetail
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                              : 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700'
                              }`}
                          >
                            {showOptimizationDetail ? (
                              <>
                                <ChevronUp size={16} className="mr-2 inline" />
                                Ocultar Análisis {activeModelFormatted}
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} className="mr-2 inline" />
                                Ver Análisis {activeModelFormatted}
                              </>
                            )}
                          </button>

                          {/* Botón de Análisis Camila (Si estuviera disponible al mismo tiempo) */}
                          <button
                            onClick={() => setShowCamilaDetail(!showCamilaDetail)}
                            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg ${showCamilaDetail
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                              : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                              }`}
                          >
                            {showCamilaDetail ? (
                              <>
                                <ChevronUp size={16} className="mr-2 inline" />
                                Ocultar Análisis Camila
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} className="mr-2 inline" />
                                Ver Análisis Camila
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCamilaActive && (
                    <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 border-2 border-teal-700 rounded-xl px-6 py-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-teal-500 rounded-full mr-4 animate-pulse"></div>
                          <div>
                            <span className="text-lg font-bold text-teal-400">
                              ⚡ Modelo Camila Activo
                            </span>
                            <div className="text-sm text-teal-300 mt-1">
                              {selectedPatioFormatted} • Semana {timeState.camilaConfig?.week} •
                              Modelo {timeState.camilaConfig?.modelType === 'minmax' ? 'MinMax' : 'MaxMin'} •
                              {timeState.camilaConfig?.withSegregations ? 'Con Segregaciones' : 'Sin Segregaciones'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {/* Botón de Análisis Camila */}
                          <button
                            onClick={() => setShowCamilaDetail(!showCamilaDetail)}
                            className={`px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg ${showCamilaDetail
                              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                              : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700'
                              }`}
                          >
                            {showCamilaDetail ? (
                              <>
                                <ChevronUp size={16} className="mr-2 inline" />
                                Ocultar Análisis Camila
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} className="mr-2 inline" />
                                Ver Análisis Camila
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENEDOR PRINCIPAL CON MAPA Y KPIs */}
              <div className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* COLUMNA IZQUIERDA: MAPA (2/3 del espacio) */}
                  <div className="lg:col-span-2">
                    <div className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg h-[calc(100vh-250px)]">
                      <MapPanel
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        filters={filters}
                        getColorForOcupacion={getColorForOcupacion}
                        timeState={timeState}
                        isLoading={isLoadingData}
                        blockCapacities={blockCapacities}
                        optimizationResult={optimizationMetrics}
                        isCamilaActive={isCamilaActive}
                        camilaData={camilaData}
                        referenceMetrics={referenceMetrics}
                        comparisonType={comparisonTarget}
                        isComparisonEnabled={isComparisonEnabled}
                      />
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: KPIs (1/3 del espacio) */}
                  <div className="lg:col-span-1">
                    <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                      {/* KPIs FUNDAMENTALES */}
                      <div className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg">
                        <div className="p-4 border-b bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-blue-200 text-lg flex items-center">
                                <BarChart3 size={20} className="mr-3" />
                                KPIs de la Terminal
                              </h3>
                              <p className="text-blue-300 text-sm">
                                KPIs del patio {selectedPatioFormatted}
                              </p>
                            </div>
                            <button
                              onClick={() => setShowAnalytics(!showAnalytics)}
                              className={`p-2 rounded-lg transition-colors ${showAnalytics
                                ? 'bg-cyan-500 text-white'
                                : 'hover:bg-slate-700 text-slate-400'
                                }`}
                              title="Análisis avanzado"
                            >
                              <BarChart3 size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <CorePortKPIPanel
                            key={`kpi-${viewState.level}-${viewState.selectedPatio || 'all'}-${viewState.selectedBloque || 'all'}`}
                            blockCapacities={blockCapacities}
                          />
                        </div>
                      </div>

                      {/* Panel de Análisis Avanzado */}
                      {showAnalytics && (
                        <CongestionAnalyticsPanel
                          patioFilter={viewState.selectedPatio}
                          bloqueFilter={undefined}
                        />
                      )}

                      {/* KPIs DE MODELOS SI ESTÁN ACTIVOS */}
                      {isOptimizationActive && (
                        <div className="bg-slate-800 rounded-xl border-2 border-cyan-700 shadow-lg">
                          <div className="p-4 border-b bg-gradient-to-r from-cyan-900/50 to-cyan-800/50">
                            <h3 className="font-bold text-cyan-300 text-lg capitalize">
                              🔮 KPIs Modelo {activeModelFormatted}
                            </h3>

                          </div>
                          <div className="p-4">
                            <OptimizationKPIPanel 
                              data={optimizationMetrics}
                              isLoading={isLoadingOptimization}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ANÁLISIS DETALLADO - Aparece debajo cuando se activa */}
                {showOptimizationDetail && isOptimizationActive && (
                  <div className="mt-4">
                    <div className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg">
                      <div className="p-6 border-b bg-gradient-to-r from-cyan-900/30 to-blue-900/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-2xl text-slate-100 flex items-center capitalize">
                              🔍 Análisis Detallado - {activeModelFormatted} vs Real
                            </h3>
                            <p className="text-slate-300 mt-2 font-medium">
                              Comparaciones, segregaciones, workload y métricas avanzadas
                            </p>
                          </div>
                          <button
                            onClick={() => setShowOptimizationDetail(false)}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <ChevronUp size={24} className="text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <OptimizationComparisonPanel />
                      </div>
                    </div>
                  </div>
                )}

                {showCamilaDetail && (isCamilaActive || isOptimizationActive) && (
                  <div className="mt-4">
                    <div className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg">
                      <div className="p-6 border-b bg-gradient-to-r from-teal-900/30 to-pink-900/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-2xl text-slate-100 flex items-center">
                              🔍 Análisis Detallado - Modelo Camila
                            </h3>
                            <p className="text-slate-300 mt-2 font-medium">
                              Optimización de carga de trabajo, asignación de grúas y análisis temporal
                            </p>
                          </div>
                          <button
                            onClick={() => setShowCamilaDetail(false)}
                            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <ChevronUp size={24} className="text-slate-400" />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <CamilaPanel />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VISTA BLOQUE: Layout con KPIs similar a vista patio */}
          {viewState.level === 'bloque' && (
            <div className="h-full flex flex-col overflow-hidden bg-slate-900">
              {timeState.dataSource === 'historical' && (
                <div className="flex-shrink-0 p-4 bg-slate-900 border-b border-slate-700">
                  <TimeControl className="w-full" />
                </div>
              )}

              {(isOptimizationActive || isCamilaActive) && (
                <div className="flex-shrink-0 p-4 bg-slate-900 border-b border-slate-700">
                  {isOptimizationActive && (
                    <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border-2 border-green-700 rounded-xl px-6 py-4 shadow-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-4 animate-pulse"></div>
                        <div>
                          <span className="text-lg font-bold text-green-400 capitalize">
                            🔮 Modelo {activeModelFormatted} Activo
                          </span>
                          <div className="text-sm text-green-300 mt-1">
                            {selectedPatioFormatted} • Bloque {viewState.selectedBloque} • Semana {optimizationConfig.semana}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCamilaActive && (
                    <div className="bg-gradient-to-r from-teal-900/30 to-blue-900/30 border-2 border-teal-700 rounded-xl px-6 py-4 shadow-lg">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-teal-500 rounded-full mr-4 animate-pulse"></div>
                        <div>
                          <span className="text-lg font-bold text-teal-400">
                            ⚡ Modelo Camila Activo
                          </span>
                          <div className="text-sm text-teal-300 mt-1">
                            {selectedPatioFormatted} • Bloque {viewState.selectedBloque}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENEDOR PRINCIPAL - Layout con mapa y KPIs */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                    {/* COLUMNA IZQUIERDA: MAPA (2/3 del espacio) */}
                    <div className="lg:col-span-2 h-full">
                      <div className="h-full bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg overflow-hidden">
                        <MapPanel
                          activeTab={activeTab}
                          setActiveTab={setActiveTab}
                          filters={filters}
                          getColorForOcupacion={getColorForOcupacion}
                          timeState={timeState}
                          isLoading={isLoadingData}
                          blockCapacities={blockCapacities}
                          optimizationResult={optimizationMetrics}
                          isCamilaActive={isCamilaActive}
                          camilaData={camilaData}
                          referenceMetrics={referenceMetrics}
                          comparisonType={comparisonTarget}
                          isComparisonEnabled={isComparisonEnabled}
                        />
                      </div>
                    </div>

                    {/* COLUMNA DERECHA: KPIs (1/3 del espacio) */}
                    <div className="lg:col-span-1 h-full overflow-y-auto">
                      <div className="space-y-4">
                        {/* KPIs FUNDAMENTALES */}
                        <div className="bg-slate-800 rounded-xl border-2 border-slate-700 shadow-lg">
                          <div className="p-4 border-b bg-gradient-to-r from-blue-900/50 to-blue-800/50 border-slate-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-blue-200 text-lg flex items-center">
                                  <BarChart3 size={20} className="mr-3" />
                                  KPIs de la Terminal
                                </h3>
                                <p className="text-blue-300 text-sm">
                                  {selectedPatioFormatted} • Bloque {viewState.selectedBloque}
                                </p>
                              </div>
                              <button
                                onClick={() => setShowAnalytics(!showAnalytics)}
                                className={`p-2 rounded-lg transition-colors ${showAnalytics
                                  ? 'bg-cyan-500 text-white'
                                  : 'hover:bg-slate-700 text-slate-400'
                                  }`}
                                title="Análisis avanzado"
                              >
                                <BarChart3 size={18} />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <CorePortKPIPanel
                              key={`kpi-${viewState.level}-${viewState.selectedPatio || 'all'}-${viewState.selectedBloque || 'all'}`}
                              blockCapacities={blockCapacities}
                            />
                          </div>
                        </div>

                        {/* Panel de Análisis Avanzado */}
                        {showAnalytics && (
                          <CongestionAnalyticsPanel
                            patioFilter={viewState.selectedPatio}
                            bloqueFilter={viewState.selectedBloque}
                          />
                        )}

                        {/* KPIs DE MODELOS SI ESTÁN ACTIVOS */}
                        {isOptimizationActive && (
                          <div className="bg-slate-800 rounded-xl border-2 border-cyan-700 shadow-lg">
                            <div className="p-4 border-b bg-gradient-to-r from-cyan-900/50 to-cyan-800/50">
                              <h3 className="font-bold text-cyan-300 text-lg capitalize">
                                🔮 KPIs Modelo {activeModelFormatted}
                              </h3>

                            </div>
                            <div className="p-4">
                              <OptimizationKPIPanel 
                                data={optimizationMetrics}
                                isLoading={isLoadingOptimization}
                              />
                            </div>
                          </div>
                        )}

                        {/* KPIs DE CAMILA SI ESTÁ ACTIVO */}
                        {isCamilaActive && (
                          <div className="bg-slate-800 rounded-xl border-2 border-teal-700 shadow-lg">
                            <div className="p-4 border-b bg-gradient-to-r from-teal-900/50 to-teal-800/50">
                              <h3 className="font-bold text-teal-300 text-lg">
                                ⚡ KPIs Modelo Camila
                              </h3>
                            </div>
                            <div className="p-4">
                              {/* Aquí podrías agregar un panel específico de KPIs de Camila si existe */}
                              <div className="text-teal-300 text-sm">
                                Panel de KPIs de Camila
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};