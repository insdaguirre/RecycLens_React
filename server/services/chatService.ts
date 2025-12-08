import OpenAI from 'openai';
import { queryRAG } from './ragService.js';
import type { ChatMessage, ChatContext } from '../types.js';

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
          type: 'web_search' as const,
          user_location: userLocation,
        },
      ],
    });
    
    const outputText = response.output_text || '';
    if (!outputText) {
      throw new Error('No response from chat API');
    }
    
    // Extract web search sources if available
    // Note: Responses API may include sources in tools_used or we may need to parse from response
    const webSources: string[] = [];
    if ((response as any).tools_used) {
      const toolsUsed = (response as any).tools_used;
      for (const tool of toolsUsed) {
        if (tool.type === 'web_search' && tool.web_search_results) {
          for (const result of tool.web_search_results) {
            if (result.url) {
              webSources.push(result.url);
            }
          }
        }
      }
    }
    
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

