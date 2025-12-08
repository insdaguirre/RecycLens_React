import { useState } from 'react';
import { analyzeVision, analyzeRecyclability } from '../utils/api';
import type { AnalyzeRequest, AnalyzeState, AnalysisStage, VisionResponse } from '../types/recycleiq';

export function useAnalyzeItem() {
  const [state, setState] = useState<AnalyzeState>({
    loading: false,
    error: null,
    data: null,
    stage: 'idle',
  });
  const [visionData, setVisionData] = useState<VisionResponse | null>(null);

  const analyze = async (request: AnalyzeRequest) => {
    setState({
      loading: true,
      error: null,
      data: null,
      stage: request.image ? 'analyzing-vision' : 'querying-rag',
    });

    try {
      let visionResult: VisionResponse | null = null;
      
      // Stage 1: Vision Analysis (only if image is provided)
      if (request.image) {
        visionResult = await analyzeVision(request.image);
        setVisionData(visionResult);
      } else {
        setVisionData(null);
      }
      
      // Stage 2: Query RAG (simulated, like Shiny)
      setState(prev => ({ ...prev, stage: 'querying-rag' }));
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay like Shiny
      
      // Stage 3: Recyclability Analysis
      setState(prev => ({ ...prev, stage: 'analyzing-recyclability' }));
      const response = await analyzeRecyclability(
        visionResult,
        request.location,
        request.context
      );
      
      // Stage 4: Geocoding (will be set when facilities are loaded)
      setState(prev => ({
        ...prev,
        stage: 'geocoding',
        data: response,
      }));
      
      // Return response for further processing (geocoding will be handled separately)
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze item';
      setState({
        loading: false,
        error: errorMessage,
        data: null,
        stage: 'error',
      });
      throw error;
    }
  };

  const setStage = (stage: AnalysisStage) => {
    setState(prev => ({ ...prev, stage }));
  };

  const complete = () => {
    setState(prev => ({
      ...prev,
      loading: false,
      stage: 'complete',
    }));
  };

  const reset = () => {
    setState({
      loading: false,
      error: null,
      data: null,
      stage: 'idle',
    });
    setVisionData(null);
  };

  return {
    analyze,
    setStage,
    complete,
    reset,
    loading: state.loading,
    error: state.error,
    data: state.data,
    stage: state.stage,
    visionData,
  };
}

