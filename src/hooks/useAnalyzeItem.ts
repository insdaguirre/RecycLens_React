import { useState } from 'react';
import { analyzeItem } from '../utils/api';
import type { AnalyzeRequest, AnalyzeResponse, AnalyzeState } from '../types/recycleiq';

export function useAnalyzeItem() {
  const [state, setState] = useState<AnalyzeState>({
    loading: false,
    error: null,
    data: null,
  });

  const analyze = async (request: AnalyzeRequest) => {
    setState({
      loading: true,
      error: null,
      data: null,
    });

    try {
      const response = await analyzeItem(request);
      setState({
        loading: false,
        error: null,
        data: response,
      });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze item';
      setState({
        loading: false,
        error: errorMessage,
        data: null,
      });
      throw error;
    }
  };

  const reset = () => {
    setState({
      loading: false,
      error: null,
      data: null,
    });
  };

  return {
    analyze,
    reset,
    loading: state.loading,
    error: state.error,
    data: state.data,
  };
}

