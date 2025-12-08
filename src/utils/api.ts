import type { AnalyzeRequest, AnalyzeResponse, VisionResponse, ChatMessage, ChatContext } from '../types/recycleiq';

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

export async function analyzeVision(image: string): Promise<VisionResponse> {
  const response = await fetch('/api/analyze/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export async function analyzeRecyclability(
  visionResult: VisionResponse | null,
  location: string,
  context: string
): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze/recyclability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visionResult, location, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export interface ChatApiResponse {
  response: string;
  sources?: {
    rag?: string[];
    web?: string[];
  };
}

export async function sendChatMessage(
  message: string,
  conversationHistory?: ChatMessage[],
  context?: ChatContext
): Promise<ChatApiResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, context }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

