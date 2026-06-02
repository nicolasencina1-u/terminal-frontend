// src/components/map/views/patio/OptimizationModelTemporalSelector.tsx - VERSIÓN COMPACTA
import React from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

interface TemporalSelectorProps {
    currentTurno: number;
    totalTurnos: number;
    onTurnoChange: (turno: number | 'semana') => void;
    vistaActual: 'semana' | 'turno';
    onVistaChange: (vista: 'semana' | 'turno') => void;
}

export const OptimizationModelTemporalSelector: React.FC<TemporalSelectorProps> = ({
    currentTurno,
    totalTurnos,
    onTurnoChange,
    vistaActual,
    onVistaChange
}) => {
    const getTurnoInfo = (turno: number) => {
        const dia = Math.floor((turno - 1) / 3) + 1;
        const turnoDelDia = ((turno - 1) % 3) + 1;
        const nombresTurnos = ['Mañana', 'Tarde', 'Noche'];
        const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        return {
            diaCorto: diasSemana[dia - 1],
            turnoCorto: nombresTurnos[turnoDelDia - 1],
            descripcion: `${diasSemana[dia - 1]} - ${nombresTurnos[turnoDelDia - 1]}`
        };
    };

    const handleVistaChange = (nuevaVista: 'semana' | 'turno') => {
        onVistaChange(nuevaVista);
        if (nuevaVista === 'semana') {
            onTurnoChange('semana');
        } else {
            onTurnoChange(currentTurno === 0 ? 1 : currentTurno);
        }
    };

    const turnoInfo = vistaActual === 'turno' && currentTurno > 0 ? getTurnoInfo(currentTurno) : null;

    return (
        <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-3 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center">
                    <Clock className="mr-1.5 text-cyan-400" size={16} />
                    Vista Temporal
                </h3>
                <div className="flex gap-1">
                    <button
                        onClick={() => handleVistaChange('semana')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${vistaActual === 'semana'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        <Calendar size={12} className="inline mr-1" />
                        Semana
                    </button>
                    <button
                        onClick={() => handleVistaChange('turno')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${vistaActual === 'turno'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        <Clock size={12} className="inline mr-1" />
                        Turno
                    </button>
                </div>
            </div>

            {vistaActual === 'semana' ? (
                <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/30 rounded p-3 border border-cyan-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-cyan-300">Vista Agregada</div>
                            <div className="text-xs text-slate-400">Promedio de 21 turnos</div>
                        </div>
                        <BarChart3 size={24} className="text-cyan-400" />
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={() => onTurnoChange(Math.max(1, currentTurno - 1))}
                            disabled={currentTurno === 1}
                            className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-300 disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex-1 mx-2 text-center">
                            <div className="text-lg font-bold text-cyan-300">
                                Turno {currentTurno}/21
                            </div>
                            <div className="text-xs text-cyan-400">
                                {turnoInfo?.descripcion}
                            </div>
                        </div>

                        <button
                            onClick={() => onTurnoChange(Math.min(totalTurnos, currentTurno + 1))}
                            disabled={currentTurno === totalTurnos}
                            className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-300 disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="relative">
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{ width: `${(currentTurno / totalTurnos) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dia, index) => (
                                <div
                                    key={index}
                                    className={`text-xs font-medium cursor-pointer hover:text-cyan-300 transition-colors ${Math.floor((currentTurno - 1) / 3) === index
                                            ? 'text-cyan-400'
                                            : 'text-slate-600'
                                        }`}
                                    onClick={() => onTurnoChange(index * 3 + 1)}
                                >
                                    {dia}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};