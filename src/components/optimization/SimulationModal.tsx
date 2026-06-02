// src/components/SimulationModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Play, Calendar, AlertCircle } from 'lucide-react';
import { simulationService } from '../../services/simulationApi';

interface SimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (config: SimulationConfig) => void;
    defaultAnio?: number;
    defaultParticipacion?: number;
    defaultVariant?: string;
}

interface SimulationConfig {
    anio: number;
    participacion: number;
    semanas: string[];
    criterio?: string;
    variant: string;
    granularidad: string;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
    isOpen,
    onClose,
    onStart,
    defaultAnio = 2022,
    defaultParticipacion = 68,
    defaultVariant = 'magdalena'
}) => {
    const [config, setConfig] = useState<SimulationConfig>({
        anio: defaultAnio,
        participacion: defaultParticipacion,
        semanas: [],
        criterio: 'criterioII',
        variant: defaultVariant,
        granularidad: 'bahia'
    });

    const [selectionMode, setSelectionMode] = useState<'single' | 'multiple' | 'year'>('single');
    const [selectedWeek, setSelectedWeek] = useState<number>(1);
    const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
    const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());

    // Actualizar configuración cuando cambia la variante
    useEffect(() => {
        if (config.variant === 'magdalena' || config.variant === 'camila') {
            setConfig(prev => ({
                ...prev,
                criterio: 'criterioII',
                granularidad: 'bahia' // Por defecto para magdalena, pero se ignora en backend
            }));
        } else if (config.variant === 'pipeline' || config.variant === 'e-constraint') {
            // Valores por defecto para nuevos modelos
            setConfig(prev => ({
                ...prev,
                criterio: prev.criterio || 'criterioIII',
                granularidad: prev.granularidad || 'bahia'
            }));
        }
    }, [config.variant]);

    // Generar semanas cuando cambia el año
    useEffect(() => {
        const weeks = simulationService.getISOWeeksForYear(config.anio);
        setAvailableWeeks(weeks);
        setSelectedWeeks(new Set());
    }, [config.anio]);

    // Manejar cambio de modo de selección
    useEffect(() => {
        if (selectionMode === 'year') {
            setSelectedWeeks(new Set(availableWeeks));
        } else if (selectionMode === 'single') {
            const week = availableWeeks[selectedWeek - 1];
            if (week) {
                setSelectedWeeks(new Set([week]));
            }
        }
    }, [selectionMode, selectedWeek, availableWeeks]);

    const handleStart = () => {
        if (selectedWeeks.size === 0) {
            alert('Por favor selecciona al menos una semana');
            return;
        }

        onStart({
            ...config,
            semanas: Array.from(selectedWeeks).sort()
        });
    };

    const toggleWeek = (week: string) => {
        if (selectionMode !== 'multiple') return;

        const newSelection = new Set(selectedWeeks);
        if (newSelection.has(week)) {
            newSelection.delete(week);
        } else {
            newSelection.add(week);
        }
        setSelectedWeeks(newSelection);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-semibold text-white">Configurar Simulación</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Año */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Año
                            </label>
                            <select
                                value={config.anio}
                                onChange={(e) => setConfig({ ...config, anio: Number(e.target.value) })}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                {[2020, 2021, 2022, 2023, 2024].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        {/* Participación */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Participación (%)
                            </label>
                            <input
                                type="number"
                                min="50"
                                max="100"
                                value={config.participacion}
                                onChange={(e) => setConfig({ ...config, participacion: Number(e.target.value) })}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Variante de Modelo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Modelo de Optimización
                            </label>
                            <select
                                value={config.variant}
                                onChange={(e) => setConfig({ ...config, variant: e.target.value })}
                                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="magdalena">Magdalena</option>
                                <option value="camila">Camila</option>
                                <option value="pipeline">Pipeline</option>
                                <option value="e-constraint">E-Constraint (Unificado)</option>
                            </select>
                        </div>

                        {/* Granularidad */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Granularidad
                            </label>
                            <select
                                value={config.granularidad}
                                onChange={(e) => setConfig({ ...config, granularidad: e.target.value })}
                                className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                    config.variant === 'magdalena' || config.variant === 'camila' ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={config.variant === 'magdalena' || config.variant === 'camila'}
                            >
                                <option value="bahia">Bahía</option>
                                <option value="pila">Pila</option>
                            </select>
                            {(config.variant === 'magdalena' || config.variant === 'camila') && (
                                <p className="text-[10px] text-slate-500 mt-1 italic">No aplica para este modelo</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Criterio */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Criterio
                            </label>
                            <select
                                value={config.criterio}
                                onChange={(e) => setConfig({ ...config, criterio: e.target.value })}
                                className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                    config.variant === 'magdalena' || config.variant === 'camila' ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={config.variant === 'magdalena' || config.variant === 'camila'}
                            >
                                <option value="criterioI">Criterio I</option>
                                <option value="criterioII">Criterio II (Por defecto)</option>
                                <option value="criterioIII">Criterio III</option>
                            </select>
                            {(config.variant === 'magdalena' || config.variant === 'camila') && (
                                <p className="text-[10px] text-slate-500 mt-1 italic">Fijo en Criterio II para Magdalena</p>
                            )}
                        </div>
                    </div>

                    {/* Modo de selección de semanas */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Selección de Semanas
                        </label>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setSelectionMode('single')}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${selectionMode === 'single'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Una semana
                            </button>
                            <button
                                onClick={() => setSelectionMode('multiple')}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${selectionMode === 'multiple'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Múltiples semanas
                            </button>
                            <button
                                onClick={() => setSelectionMode('year')}
                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${selectionMode === 'year'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Año completo
                            </button>
                        </div>
                    </div>

                    {/* Selección de semanas según el modo */}
                    {selectionMode === 'single' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Semana {selectedWeek} - {availableWeeks[selectedWeek - 1]}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max={availableWeeks.length}
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Semana 1</span>
                                <span>Semana {availableWeeks.length}</span>
                            </div>
                        </div>
                    )}

                    {selectionMode === 'multiple' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Selecciona las semanas ({selectedWeeks.size} seleccionadas)
                            </label>
                            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-900 rounded">
                                {availableWeeks.map((week, index) => (
                                    <button
                                        key={week}
                                        onClick={() => toggleWeek(week)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selectedWeeks.has(week)
                                                ? 'bg-cyan-500 text-white'
                                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                        title={week}
                                    >
                                        S{index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectionMode === 'year' && (
                        <div className="bg-slate-900 rounded p-3">
                            <div className="flex items-center text-sm text-slate-300">
                                <Calendar className="mr-2" size={16} />
                                Se simularán las {availableWeeks.length} semanas del año {config.anio}
                            </div>
                        </div>
                    )}

                    {/* Resumen */}
                    <div className="bg-slate-900 rounded p-3 space-y-1">
                        <div className="text-sm font-medium text-slate-300">Resumen de simulación:</div>
                        <div className="text-xs text-slate-400 space-y-1">
                            <div>• Modelo: {config.variant}</div>
                            <div>• Año: {config.anio}</div>
                            <div>• Participación: {config.participacion}%</div>
                            {config.variant !== 'camila' && (
                                <div>• Criterio: {config.criterio}</div>
                            )}
                            <div>• Granularidad: {config.granularidad}</div>
                            <div>• Semanas a simular: {selectedWeeks.size}</div>
                            {selectedWeeks.size > 0 && selectedWeeks.size <= 5 && (
                                <div>• Fechas: {Array.from(selectedWeeks).slice(0, 5).join(', ')}</div>
                            )}
                        </div>
                    </div>

                    {/* Advertencia */}
                    {selectedWeeks.size > 10 && (
                        <div className="bg-yellow-950/30 border border-yellow-700 rounded p-3">
                            <div className="flex items-start text-sm text-yellow-400">
                                <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                                <span>
                                    Simular {selectedWeeks.size} semanas puede tomar considerable tiempo.
                                    Tiempo estimado: {Math.round(selectedWeeks.size * 1.5)} - {Math.round(selectedWeeks.size * 2)} minutos.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={selectedWeeks.size === 0}
                        className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${selectedWeeks.size > 0
                                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Play className="mr-2" size={16} />
                        Iniciar Simulación
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimulationModal;