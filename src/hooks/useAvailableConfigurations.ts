// src/hooks/useAvailableConfigurations.ts
import { useState, useEffect } from 'react';
import { optimizationApi } from '../services/optimizationApi';
import type { AvailableConfiguration } from '../types/optimization';

interface UseAvailableConfigurationsReturn {
    configurations: AvailableConfiguration[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useAvailableConfigurations = (variant?: string): UseAvailableConfigurationsReturn => {
    const [configurations, setConfigurations] = useState<AvailableConfiguration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigurations = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const data = await optimizationApi.getAvailableConfigurations(variant);
            setConfigurations(data);

            console.log(`✅ ${data.length} configuraciones disponibles cargadas${variant ? ` para variante ${variant}` : ''}`);
        } catch (err: any) {
            console.error('❌ Error cargando configuraciones:', err);
            setError(err.message || 'Error al cargar configuraciones disponibles');
            setConfigurations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigurations();
    }, [variant]);

    return {
        configurations,
        isLoading,
        error,
        refetch: fetchConfigurations
    };
};