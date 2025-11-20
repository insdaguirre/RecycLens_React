import OpenAI from 'openai';
import type { VisionResponse } from '../types.js';

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey });
}

/**
 * Analyzes an image to identify materials and recycling-relevant conditions
 */
export async function analyzeImage(imageBase64: string): Promise<VisionResponse> {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  try {
    const openai = getOpenAIClient();
    
    // Prepare input for Responses API
    // Include image as data URL in the input string
    const input = `You are a recycling materials expert. Analyze the image and identify the primary material(s) and recycling-relevant condition. Return your response as a JSON object with the following structure: {primaryMaterial: string, secondaryMaterials: string[], category: string, condition: string, contaminants: string[], confidence: number (0-1), shortDescription: string}

Analyze this image and return the material analysis as JSON.

[Image: data:image/jpeg;base64,${base64Data}]`;

    const response = await openai.responses.create({
      model: 'gpt-4.1',
      input: input,
    });

    const outputText = response.output_text || '';
    if (!outputText) {
      throw new Error('No response from vision API');
    }

    // Parse JSON response
    const parsed = JSON.parse(outputText);
    
    // Validate and return structured response
    return {
      primaryMaterial: parsed.primaryMaterial || 'Unknown',
      secondaryMaterials: Array.isArray(parsed.secondaryMaterials) ? parsed.secondaryMaterials : [],
      category: parsed.category || 'Unknown',
      condition: parsed.condition || 'unknown',
      contaminants: Array.isArray(parsed.contaminants) ? parsed.contaminants : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      shortDescription: parsed.shortDescription || parsed.description || 'No description available',
    };
  } catch (error) {
    console.error('Vision API error:', error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

