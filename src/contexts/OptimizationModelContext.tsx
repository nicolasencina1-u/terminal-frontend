// src/contexts/OptimizationModelContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { OptimizationConfig } from '../types/optimization';

// Definimos los tipos de modelos disponibles
export type OptimizationModelType = 'historical' | 'magdalena' | 'pipeline' | 'e-constraint';

interface OptimizationModelContextType {
    config: OptimizationConfig;
    activeModel: OptimizationModelType;
    updateConfig: (updates: Partial<OptimizationConfig>) => void;
    setConfig: (config: OptimizationConfig) => void;
    setActiveModel: (model: OptimizationModelType) => void;
}

export const OptimizationModelContext = createContext<OptimizationModelContextType | null>(null);

export const OptimizationModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<OptimizationConfig>({
        anio: 2022,
        semana: 1,
        participacion: 68,
        conDispersion: true,
        variant: 'magdalena',
        criterio: 2,
        granularidad: 'bahia'
    });

    const [activeModel, setActiveModel] = useState<OptimizationModelType>('historical');

    const updateConfig = useCallback((updates: Partial<OptimizationConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    return (
        <OptimizationModelContext.Provider value={{ config, activeModel, updateConfig, setConfig, setActiveModel }}>
            {children}
        </OptimizationModelContext.Provider>
    );
};

export const useOptimizationModelContext = () => {
    const context = useContext(OptimizationModelContext);
    if (!context) {
        throw new Error('useOptimizationModelContext must be used within OptimizationModelProvider');
    }
    return context;
};