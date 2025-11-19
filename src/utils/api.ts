import type { AnalyzeRequest, AnalyzeResponse } from '../types/recycleiq';

export async function analyzeItem(request: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

