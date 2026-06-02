// src/components/camila/selectors/ModelConfigSelector.tsx

import React from 'react';
import { Calendar, Hash, Clock, Percent } from 'lucide-react';
import { useFiltrosDisponibles } from '../../../hooks/useCamilaData';
import type { CamilaConfig } from '../../../types/camila';

interface Props {
    config: CamilaConfig;
    onChange: (config: CamilaConfig) => void;
}

const ModelConfigSelector: React.FC<Props> = ({ config, onChange }) => {
    const { data: filtros, loading } = useFiltrosDisponibles();

    const handleChange = (key: keyof CamilaConfig, value: number | undefined) => {
        onChange({ ...config, [key]: value });
    };

    if (loading || !filtros) {
        return <div className="animate-pulse bg-slate-700 h-10 rounded" />;
    }

    // Obtener años disponibles o usar valores por defecto
    const availableYears = filtros.anios && filtros.anios.length > 0
        ? filtros.anios
        : [2022, 2023, 2024]; // Valores por defecto si no vienen del backend

    return (
        <div className="space-y-4">
            {/* Primera fila: Año y Semana */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Año */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                        <Calendar size={16} className="inline mr-1" />
                        Año
                    </label>
                    <select
                        value={config.anio || availableYears[0]}
                        onChange={(e) => handleChange('anio', parseInt(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-teal-500"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Semana */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                        <Calendar size={16} className="inline mr-1" />
                        Semana
                    </label>
                    <select
                        value={config.semana}
                        onChange={(e) => handleChange('semana', parseInt(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-teal-500"
                    >
                        {filtros.semanas.map(semana => (
                            <option key={semana} value={semana}>
                                Semana {semana}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Turno */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                        <Clock size={16} className="inline mr-1" />
                        Turno
                    </label>
                    <select
                        value={config.turno || ''}
                        onChange={(e) => handleChange('turno', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Todos</option>
                        {filtros.turnos.map(turno => (
                            <option key={turno} value={turno}>
                                Turno {turno} ({filtros.descripciones.turnos_del_dia[((turno - 1) % 3) + 1]})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Participación */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">
                        <Percent size={16} className="inline mr-1" />
                        Participación
                    </label>
                    <select
                        value={config.participacion}
                        onChange={(e) => handleChange('participacion', parseInt(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-teal-500"
                    >
                        {filtros.participaciones.map(participacion => (
                            <option key={participacion} value={participacion}>
                                {participacion}%
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Resumen de configuración */}
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm">
                <p className="text-slate-300 font-medium">Configuración actual:</p>
                <p className="text-slate-400">
                    Año {config.anio || availableYears[0]} •
                    Semana {config.semana} •
                    {config.dia ? `${filtros.descripciones.dias[config.dia]} • ` : ''}
                    {config.turno ? `Turno ${config.turno} • ` : 'Todos los turnos • '}
                    Participación {config.participacion}%
                </p>
            </div>
        </div>
    );
};

export default ModelConfigSelector;