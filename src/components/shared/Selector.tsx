import React from 'react';
import { ArrowRightLeft, History, Zap, GitBranch, LayoutGrid, ToggleLeft, ToggleRight } from 'lucide-react';
import { type comparisonSource } from '../map/views/patio/patioDataHelpers';

interface ComparisonSourceSelectorProps{
    value: comparisonSource,
    isEnabled: boolean,
    onChange: (source: comparisonSource) => void,
    onToggle: (enabled: boolean) => void,
    activeSource?: string
}

export const ComparisonSourceSelector: React.FC<ComparisonSourceSelectorProps> =({
    isEnabled,
    onToggle,
    value,
    onChange,
    activeSource
}) => {

    const options = [
        { id: 'historico', label: 'Historico (Real)', icon: History, color: 'text-slate-400' },
        { id: 'magdalena', label: 'Modelo Magdalena', icon: Zap, color: 'text-green-400' },
        { id: 'pipeline', label: 'Modelo Pipeline', icon: GitBranch, color: 'text-blue-400' },
        { id: 'e-constraint', label: 'E-Constraint', icon: LayoutGrid, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-3 p-3 rounded-xl border border-slate-700/50 bg-slate-800/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft size={14} className={isEnabled ? "text-cyan-400" : "text-slate-500"} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        comparacion
                    </span>
                </div>

                <button 
                    onClick={() => onToggle(!isEnabled)}
                    className={`transition-colors ${isEnabled ? 'text-cyan-500' : 'text-slate-600'}`}
                >
                    {isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
            </div>
      
            {isEnabled && (
                <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-700/30 animate-in fade-in slide-in-from-top-1">
                    {options.map((opt) => {
                        const Icon = opt.icon;
                        const isActive = value === opt.id;
                        
                        // Determinar si esta opciÃ³n representa la misma fuente activa principal
                        const normalizedActive = activeSource?.toLowerCase() || '';
                        const isSameAsActive = (normalizedActive === 'historical' && opt.id === 'historico') ||
                            (normalizedActive === 'magdalena' && opt.id === 'magdalena') ||
                            (normalizedActive === 'pipeline' && opt.id === 'pipeline') ||
                            (normalizedActive === 'econstraint' && opt.id === 'e-constraint') ||
                            (normalizedActive === 'e-constraint' && opt.id === 'e-constraint');

                        return (
                            <button
                                key={opt.id}
                                onClick={() => !isSameAsActive && onChange(opt.id as comparisonSource)}
                                disabled={isSameAsActive}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                                    isActive 
                                        ? 'bg-slate-700 text-white border border-slate-600' 
                                        : isSameAsActive
                                            ? 'text-slate-600 cursor-not-allowed opacity-50'
                                            : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200'
                                }`}
                            >
                                <Icon size={14} className={isActive ? opt.color : 'text-slate-500'} />
                                <span>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ComparisonSourceSelector;