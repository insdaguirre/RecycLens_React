import OpenAI from 'openai';
import { queryRAG } from './ragService.js';
import type { ChatMessage, ChatContext } from '../types.js';

function normalizeHttpUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function extractWebSearchUrlsFromResponse(response: any): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const addUrl = (u: unknown) => {
    if (typeof u !== 'string') return;
    const normalized = normalizeHttpUrl(u);
    if (!normalized) return;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  const addFromResults = (results: any) => {
    if (!Array.isArray(results)) return;
    for (const r of results) {
      addUrl(r?.url);
    }
  };

  // Primary: Responses API structured output items
  const output = (response as any)?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const type = String(item?.type || '');
      // Common shapes:
      // - { type: 'web_search_call', results: [{ url, ...}] }
      // - { type: 'web_search', web_search_results: [{ url, ...}] }
      if (type.includes('web_search')) {
        addFromResults(item?.results);
        addFromResults(item?.web_search_results);
        addFromResults(item?.result?.results);
      }
      // Some SDKs may wrap tool output under a generic tool item
      if (item?.tool_name === 'web_search' || item?.name === 'web_search') {
        addFromResults(item?.results);
        addFromResults(item?.web_search_results);
        addFromResults(item?.result?.results);
      }

      // Responses API often returns citations on the message output (ground-truth URLs)
      if (type === 'message' && Array.isArray(item?.content)) {
        for (const contentItem of item.content) {
          if (!Array.isArray(contentItem?.annotations)) continue;
          for (const ann of contentItem.annotations) {
            if (ann?.type === 'url_citation' && ann?.url) {
              addUrl(ann.url);
            }
          }
        }
      }
    }
  }

  // Fallback: legacy/undocumented field used by older code paths
  if (out.length === 0 && Array.isArray((response as any)?.tools_used)) {
    for (const tool of (response as any).tools_used) {
      if (tool?.type === 'web_search') {
        addFromResults(tool?.web_search_results);
        addFromResults(tool?.results);
      }
    }
  }

  return out;
}

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey });
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: ChatContext;
}

export interface ChatResponse {
  response: string;
  sources?: {
    rag?: string[];
    web?: string[];
  };
}

/**
 * Sends a chat message with RAG and web search support
 */
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const openai = getOpenAIClient();
    
    // Build system prompt with context
    let systemPrompt = `You are a helpful recycling and waste management assistant. You provide accurate, location-specific recycling guidance based on official regulations and current best practices.

Your role:
- Answer questions about recycling, waste disposal, and environmental practices
- Use location-specific information when available
- Provide clear, actionable advice
- Cite sources when referencing regulations or guidelines
- Be friendly, helpful, and informative`;

    // Query RAG if context is provided
    let ragContext = '';
    let ragSources: string[] = [];
    
    if (request.context) {
      const { analysisData, location, material, visionData } = request.context;
      
      // Build context summary for system prompt
      if (analysisData || visionData || material) {
        systemPrompt += `\n\nCurrent Context:\n`;
        
        if (material || visionData?.primaryMaterial) {
          const materialName = material || visionData?.primaryMaterial || 'item';
          systemPrompt += `- User is asking about: ${materialName}\n`;
        }
        
        if (location) {
          systemPrompt += `- User location: ${location}\n`;
        }
        
        if (analysisData) {
          systemPrompt += `- Previous analysis: ${analysisData.isRecyclable ? 'Recyclable' : 'Not Recyclable'}\n`;
          systemPrompt += `- Category: ${analysisData.category}\n`;
          systemPrompt += `- Bin: ${analysisData.bin}\n`;
          if (analysisData.instructions.length > 0) {
            systemPrompt += `- Disposal instructions: ${analysisData.instructions.join('; ')}\n`;
          }
        }
      }
      
      // Query RAG if we have location and material
      const materialForRAG = material || visionData?.primaryMaterial || analysisData?.materialDescription || '';
      const locationForRAG = location || analysisData?.locationUsed || '';
      
      if (materialForRAG && locationForRAG) {
        const conditionForRAG = visionData?.condition || analysisData?.category || '';
        const contextForRAG = analysisData?.reasoning || '';
        
        const ragResult = await queryRAG(
          materialForRAG,
          locationForRAG,
          conditionForRAG,
          contextForRAG
        );
        
        if (ragResult && ragResult.regulations) {
          ragContext = ragResult.regulations;
          ragSources = ragResult.sources || [];
          
          if (ragContext) {
            systemPrompt += `\n\nLocal Recycling Regulations (from official sources):\n${ragContext}\n\nUse these official regulations as the primary source for location-specific recycling information.`;
          }
        }
      }
    }
    
    // Build conversation history for Responses API
    const conversationText = buildConversationText(request.conversationHistory || [], request.message);
    
    // Prepare input for Responses API with web search
    const input = `${systemPrompt}\n\nConversation:\n${conversationText}`;
    
    // Parse location for user_location parameter
    let userLocation: any = undefined;
    if (request.context?.location) {
      const locationParts = request.context.location.split(',');
      userLocation = {
        type: 'approximate' as const,
        city: locationParts[0]?.trim(),
      };
      if (locationParts[1]) {
        userLocation.region = locationParts[1]?.trim();
      }
    }
    
    // Use Responses API with web search enabled
    const response = await openai.responses.create({
      model: 'gpt-4.1',
      input: input,
      tools: [
        {
          // Use web search tool for grounded citations.
          // Cast to any to avoid SDK type drift across versions.
          type: 'web_search' as any,
          user_location: userLocation,
        },
      ],
    } as any);
    
    const outputText = response.output_text || '';
    if (!outputText) {
      throw new Error('No response from chat API');
    }
    
    // Ground web sources from the actual web_search tool results (avoid hallucinated URLs)
    const webSources = extractWebSearchUrlsFromResponse(response);
    
    return {
      response: outputText,
      sources: {
        rag: ragSources.length > 0 ? ragSources : undefined,
        web: webSources.length > 0 ? webSources : undefined,
      },
    };
  } catch (error) {
    console.error('Chat service error:', error);
    throw new Error(`Failed to send chat message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Builds conversation text from message history
 */
function buildConversationText(history: ChatMessage[], currentMessage: string): string {
  let text = '';
  
  for (const msg of history) {
    const role = msg.role === 'user' ? 'User' : 'Assistant';
    text += `${role}: ${msg.content}\n\n`;
  }
  
  text += `User: ${currentMessage}\n\nAssistant:`;
  
  return text;
}

