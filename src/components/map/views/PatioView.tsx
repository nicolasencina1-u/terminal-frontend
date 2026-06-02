// src/components/map/views/PatioView.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { useTimeContext } from '../../../contexts/TimeContext';
import { useOptimizationModelContext } from '../../../contexts/OptimizationModelContext';
import { useOptimizationData } from '../../../hooks/useOptimizationData';
import { useRealPatioData } from '../../../hooks/useRealPatioData';
import { useCamilaDashboard } from '../../../hooks/useCamilaData';
import { PatioHeader } from './patio/PatioHeader';
import { PatioKPIs } from './patio/PatioKPIs';
import { PatioGrid } from './patio/PatioGrid';
import { PatioDetails } from './patio/PatioDetails';
import { CamilaTimelineControls } from './patio/CamilaTimelineControls';
import { OptimizationModelTemporalSelector } from './patio/OptimizationModelTemporalSelector';
import { PatioErrorStates } from './patio/PatioErrorStates';
import { processPatioData } from './patio/patioDataProcessor';
import type { CamilaConfig, DashboardEjecutivoResponse } from '../../../types/camila';
import { BarChart3, Eye, EyeOff } from 'lucide-react';

interface PatioViewProps {
  patioId: string;
  onBloqueClick: (patioId: string, bloqueId: string) => void;
  getColorForOcupacion: (value: number) => string;
  referenceMetrics?: OptimizationMetrics | null;
  comparisonType?: comparisonSource;
  isComparisonEnabled?: boolean;
}

export const PatioView: React.FC<PatioViewProps> = ({
  patioId,
  onBloqueClick,
  getColorForOcupacion,
  referenceMetrics = null,
  comparisonType = 'historico',
  isComparisonEnabled = false
}) => {
  const [selectedBloque, setSelectedBloque] = useState<string | null>(null);
  const [currentTurno, setCurrentTurno] = useState(0);
  const [currentPeriod, setCurrentPeriod] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vistaActual, setVistaActual] = useState<'semana' | 'turno'>('semana');
  const [showDashboard, setShowDashboard] = useState(false);

  const { timeState } = useTimeContext();
  const { config: optimizationConfig, activeModel } = useOptimizationModelContext();

  // LÃ“GICA GENERALIZADA DE OPTIMIZACIÃ“N
  const isOptimizationActive = useMemo(() => {
    const ds = timeState?.dataSource?.toLowerCase() || '';
    return ['magdalena', 'pipeline', 'econstraint', 'e-constraint'].includes(ds) && patioId === 'costanera';
  }, [timeState?.dataSource, patioId]);

  const isCamilaActive = timeState?.dataSource === 'modelCamila' && patioId === 'costanera';

  // Hook para datos reales
  const {
    patioData: realPatioDataArray,
    isLoading: isLoadingReal,
    error: realDataError,
    refreshData
  } = useRealPatioData();

  // Hook GENERALIZADO para datos de Optimización (sirve para Magdalena, Pipeline y E-Constraint)
  const {
    metrics: optimizationMetrics,
    isLoading: optimizationLoading,
    error: optimizationError
  } = useOptimizationData(
    optimizationConfig,
    undefined,
    undefined,
  );

  // Configuración de Camila
  const camilaConfig = useMemo<CamilaConfig | null>(() => {
    if (!timeState?.camilaConfig) return null;
    return {
      semana: timeState.camilaConfig.week,
      turno: timeState.camilaConfig.shift,
      dia: undefined,
      hora: undefined,
      modelType: timeState.camilaConfig.withSegregations,
      withSegregations: timeState.camilaConfig.withSegregations,
      day: timeState.camilaConfig.day || 'lunes',
      shift: timeState.camilaConfig.shift
    } as any;
  }, [timeState?.camilaConfig]);

  const { data: camilaData, loading: camilaLoading, error: camilaError } = useCamilaDashboard(camilaConfig);

  // Effect para animación
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isOptimizationActive && optimizationMetrics) {
        setCurrentTurno(prev => {
          const totalTurnos = optimizationMetrics.evolucionTemporal?.length || 21;
          if (prev >= totalTurnos) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 1;
        });
      } else if (isCamilaActive && camilaData) {
        setCurrentPeriod(prev => {
          if (prev >= 8) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isOptimizationActive, isCamilaActive, optimizationMetrics, camilaData]);

  // Procesar datos del patio
  const patio = useMemo(() => {
    const realPatioData = realPatioDataArray ? { patios: realPatioDataArray } : null;

    return processPatioData({
      isCamilaActive,
      isOptimizationActive,
      activeModelName: activeModel,
      camilaData,
      optimizationMetrics,
      realPatioData,
      timeState,
      patioId,
      currentTurno,
      currentPeriod,
      referenceMetrics,
      comparisonType
    });
  }, [isCamilaActive, isOptimizationActive, activeModel, camilaData, optimizationMetrics, realPatioDataArray, timeState, patioId, currentTurno, currentPeriod, referenceMetrics, comparisonType]);

  // Estados de error y carga
  if (isCamilaActive && !camilaData && !camilaLoading) {
    return <PatioErrorStates type="camila-no-data" config={camilaConfig} />;
  }

  if (isOptimizationActive && (optimizationError || (!optimizationMetrics && !optimizationLoading))) {
    return <PatioErrorStates type="optimization-no-data" config={optimizationConfig} error={optimizationError} activeModelName={activeModel} />;
  }

  const isLoading = (timeState?.dataSource === 'historical' && isLoadingReal) ||
    (isOptimizationActive && optimizationLoading) ||
    (isCamilaActive && camilaLoading);

  if (isLoading) {
    return <PatioErrorStates type="loading" dataSource={timeState?.dataSource} activeModelName={activeModel} />;
  }

  const error =
    (timeState?.dataSource === 'historical' ? realDataError : null) ||
    (isCamilaActive ? camilaError : null);

  if (error) {
    return <PatioErrorStates type="error" error={error} onRetry={refreshData} />;
  }

  if (!patio) {
    return <PatioErrorStates type="no-patio" />;
  }

  const hasDashboardData = isCamilaActive && camilaData?.tabs && camilaConfig;

  // Renderizado principal
  return (
    <div className="w-full h-full bg-slate-900 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto">
          
          {isCamilaActive && camilaData?.metadata && (
            <CamilaTimelineControls
              currentPeriod={currentPeriod}
              totalPeriods={8}
              onPeriodChange={setCurrentPeriod}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              turno={camilaData.metadata.turno || 1}
              turnoDelDia={((camilaData.metadata.turno || 1) - 1) % 3 + 1}
            />
          )}

          {isOptimizationActive && optimizationMetrics && (
            <OptimizationModelTemporalSelector
              currentTurno={currentTurno}
              totalTurnos={optimizationMetrics.evolucionTemporal?.length || 21}
              onTurnoChange={(turno) => {
                if (turno === 'semana') {
                  setCurrentTurno(0);
                } else {
                  setCurrentTurno(turno);
                }
              }}
              vistaActual={vistaActual}
              onVistaChange={setVistaActual}
            />
          )}

          <PatioHeader
            patio={patio}
            isCamilaActive={isCamilaActive}
            isOptimizationActive={isOptimizationActive}
            activeModelName={activeModel}
            timeState={timeState}
            currentPeriod={currentPeriod}
            currentTurno={currentTurno}
            camilaData={camilaData as any}
            optimizationMetrics={optimizationMetrics}
            onRefresh={refreshData}
          />

          {hasDashboardData && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {showDashboard ? <EyeOff size={18} /> : <Eye size={18} />}
                <BarChart3 size={18} />
                {showDashboard ? 'Ocultar' : 'Mostrar'} Dashboard Ejecutivo
              </button>
            </div>
          )}

          <PatioKPIs
            isCamilaActive={isCamilaActive}
            isOptimizationActive={isOptimizationActive}
            camilaData={camilaData as any}
            optimizationMetrics={optimizationMetrics}
            hideWhenDashboardVisible={showDashboard}
          />

          <PatioGrid
            patio={patio}
            selectedBloque={selectedBloque}
            isCamilaActive={isCamilaActive}
            isOptimizationActive={isOptimizationActive}
            activeModelName={activeModel}
            currentPeriod={currentPeriod}
            currentTurno={currentTurno}
            camilaData={camilaData as any}
            optimizationMetrics={optimizationMetrics}
            timeState={timeState}
            getColorForOcupacion={getColorForOcupacion}
            onBloqueSelect={(bloqueId) => {
              setSelectedBloque(bloqueId);
              setTimeout(() => onBloqueClick(patioId, bloqueId), 200);
            }}
            referenceMetrics={referenceMetrics}
            comparisonType={comparisonType}
            isComparisonEnabled={isComparisonEnabled}
          />

          {selectedBloque && (
            <PatioDetails
              selectedBloque={selectedBloque}
              isCamilaActive={isCamilaActive}
              isOptimizationActive={isOptimizationActive}
              activeModelName={activeModel}
              currentPeriod={currentPeriod}
              currentTurno={currentTurno}
              camilaData={camilaData as any}
              optimizationMetrics={optimizationMetrics}
              referenceMetrics={referenceMetrics}
              comparisonType={comparisonType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatioView;