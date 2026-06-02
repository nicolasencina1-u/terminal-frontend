import {useState, useEffect} from 'react';
import { pipeline } from '../services/newOptimizationApi';
import type { OptimizationMetrics } from '../types/optimization';

interface NewProps{
    modelType: 'pipeline' | 'e-constraint' | null;
    anio: number;
    semana: number;
    participacion?: number;
    dispersion?: 'K' | 'N';
    criterio?: number;
    granularidad?: string;
}

export const useNewPropsData=({
    modelType,
    anio=2022,
    semana=1,
    participacion=68,
    dispersion='K',
    criterio=2,
    granularidad='bahia'
}: NewProps)=>{
    const[data, setData] = useState<OptimizationMetrics | null>(null);
    const[isLoading, setIsLoading] = useState(false);
    const[error, setError] = useState<string | null>(null);

    useEffect(()=>{

        if(!modelType){
            setData(null);
            return;
        }

        const fetchData = async()=>{
            setIsLoading(true);

            try{
                let result: OptimizationMetrics | null = null;
                console.log(`hook: buscando datos ${modelType}`);

                if(modelType === 'pipeline'){
                    result = await pipeline.getPipeline(anio, semana, participacion, dispersion, criterio, granularidad);
                }
                else if(modelType === 'e-constraint'){
                    result = await pipeline.getEConstraint(anio, semana, participacion, dispersion, criterio, granularidad);
                }

                if(result){
                    setData(result);
                }
                else{
                    console.warn("no se han encotrado datos con los argumentos seleccionados");
                    setData(null);
                }
            }
            catch(err: any){
                console.error("error en useNewData", err);
                setError(err.message || `error al cargar los datos para el modelo ${modelType}`);
            }
            finally{setIsLoading(false)}
        };
        fetchData();
    }, [modelType, anio, semana, participacion, dispersion, criterio, granularidad]);

    return{
        newData: data,
        isLoading,
        error
    }
}