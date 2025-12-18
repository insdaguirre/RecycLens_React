import OpenAI from 'openai';
import type { VisionResponse, AnalyzeResponse, Facility } from '../types.js';
import { queryRAG } from './ragService.js';

// Lazy initialization of OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return new OpenAI({ apiKey });
}

/**
 * Parses a location string to extract city, region, and country
 * Handles formats like "Ithaca, NY 14850", "San Francisco, CA", "London, UK", etc.
 */
function parseLocation(location: string): {
  city?: string;
  region?: string;
  country?: string;
} {
  const trimmed = location.trim();

  const usStatePattern = /\b([A-Z]{2})\b/;
  const stateMatch = trimmed.match(usStatePattern);

  const parts = trimmed.split(',').map((p) => p.trim());

  if (parts.length >= 2) {
    const city = parts[0];
    const secondPart = parts[1];

    if (stateMatch && secondPart.length <= 3) {
      return { city, region: secondPart, country: 'US' };
    }

    if (parts.length >= 3) {
      return { city: parts[0], region: parts[1], country: parts[2] };
    }

    return { city, region: secondPart };
  }

  if (trimmed.length <= 10 && /^\d+/.test(trimmed)) {
    return { city: trimmed, country: 'US' };
  }

  return { city: trimmed };
}

/**
 * Extracts JSON from response text
 */
function extractJSONFromResponse(content: string): any {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through
    }
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Failed to parse JSON from assistant response');
  }
}

function normalizeFacilityUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    console.error('Problem with URL.');
    return '#';
  }
}

function stripLinks(text: string): string {
  if (!text) return '';
  let s = String(text);

  // This matches ([label](url)) even if it spans multiple lines
  s = s.replace(/\(\s*\[[^\]]+\]\s*\([\s\S]*?\)\s*\)/g, '');

  // This matches [label](url) 
  s = s.replace(/\[[^\]]+\]\s*\([\s\S]*?\)/g, '');

  // Remove any remaining raw https links
  s = s.replace(/https?:\/\/[^\s)]+/g, '');

  return s.trim();
}

function stripLinksFromArray(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => stripLinks(String(item)));
}

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
      if (type.includes('web_search')) {
        addFromResults(item?.results);
        addFromResults(item?.web_search_results);
        addFromResults(item?.result?.results);
      }
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

/**
 * Analyzes recyclability using Responses API with web search for facilities
 */
export async function analyzeRecyclability(
  visionResult: VisionResponse | null,
  context: string,
  location: string
): Promise<AnalyzeResponse> {
  try {
    const openai = getOpenAIClient();

    const parsedLocation = parseLocation(location);

    const userLocation: any = { type: 'approximate' as const };
    if (parsedLocation.city) userLocation.city = parsedLocation.city;
    if (parsedLocation.region) userLocation.region = parsedLocation.region;
    if (parsedLocation.country) userLocation.country = parsedLocation.country;

    let materialForRAG = visionResult?.primaryMaterial || '';
    let conditionForRAG = visionResult?.condition || '';

    let ragContext = '';
    let ragSources: string[] = [];
    let ragQueried = false;

    const ragServiceUrl = process.env.RAG_SERVICE_URL;

    // Only attempt RAG when it is configured. Otherwise, let the analysis fall back to web search.
    if (materialForRAG && ragServiceUrl) {
      try {
        const ragResult = await queryRAG(materialForRAG, location, conditionForRAG, context);
        ragQueried = true;

        if (ragResult) {
          ragSources = ragResult.sources || [];
          if (ragResult.regulations && ragResult.regulations.trim().length > 0) {
            ragContext = ragResult.regulations;
          }
        }
      } catch (error) {
        // Non-fatal: continue without ragContext
        ragQueried = true;
        console.error('RAG query error (non-fatal):', error);
      }
    }

    let input: string;

    if (visionResult) {
      input = `You are a recycling and disposal assistant. Analyze this item for recyclability:

Material Analysis (from image):
- Primary Material: ${visionResult.primaryMaterial}
- Category: ${visionResult.category}
- Condition: ${visionResult.condition}
- Contaminants: ${visionResult.contaminants.join(', ') || 'None'}
- Description: ${visionResult.shortDescription}

User Context: ${context || 'None provided'}

User Location: ${location}

${ragContext
          ? `\nLocal Recycling Regulations (from official sources):\n${ragContext}\n\nUse these official regulations as the primary source for determining recyclability and disposal instructions.`
          : ''
        }

Please:
1. Determine if this item is recyclable (true/false)
2. Identify the category it belongs to
3. Determine which bin it should go in (recycling, landfill, compost, hazardous, or unknown)
4. Provide clear, step-by-step instructions for proper disposal
5. Use web search to find 3-5 nearby recycling and disposal facilities in ${location}.
6. Return your complete analysis as a JSON object matching this exact structure:
{
  "isRecyclable": boolean,
  "category": string,
  "bin": "recycling" | "landfill" | "compost" | "hazardous" | "unknown",
  "confidence": number (0-1),
  "materialDescription": string (optional),
  "instructions": string[],
  "reasoning": string,
  "locationUsed": string,
  "facilities": [{
    "name": string,
    "type": string,
    "address": string,
    "url": string,
    "notes": string,
    "email": string,
    "phone": string,
    "hours": string
  }],
  "webSearchSources": string[]
}

IMPORTANT: Include a "webSearchSources" array with URLs of web pages you consulted for recycling information (not just facilities). This should include any websites you used to determine recyclability, disposal methods, or general recycling guidelines. Include the full URLs of the sources you used.

STRICT FORMATTING RULES (MANDATORY):
- Do NOT include URLs anywhere in:
  - "reasoning"
  - "instructions"
  - "materialDescription"
  - facilities[].notes
- Do NOT include markdown links, parenthesized URLs, or split-line links.
- Do NOT include patterns like:
  - [domain] (https://example.com)
  - domain (https://example.com)
  - https://example.com
- If you want to reference a source in text, write ONLY the bare domain name
  (example: tompkinscountyny.gov) with NO link and NO parentheses.
- ALL URLs must appear ONLY in:
  - "webSearchSources"
  - facilities[].url
Violating these rules is an error.

Search for queries like "recycling facilities ${location}" or "${visionResult.primaryMaterial} disposal ${location}" to find local facilities. Search for queries like "recycling facilities ${location}" or "${visionResult.primaryMaterial} disposal ${location}" to find local facilities. 
For each facility in "facilities", the "url" field must be the canonical homepage URL exactly as shown in the browser address bar of the facility’s official website. Do NOT guess URLs. Do NOT modify protocol (http/https) or add/remove "www". If the exact official website URL cannot be confidently verified, return a string "#". 

For the last three fields in "facilities", try to find each facility's contact information like email address, phone number, and hours of operation. Every facility object must include all fields listed above. If email, phone, or hours are unavailable, return them as empty strings (""). Do NOT omit fields. Do NOT use null.`;
    } else {
      input = `You are a recycling and disposal assistant. Analyze this item for recyclability based on the user's description.

User Description: ${context || 'No description provided'}

User Location: ${location}

${ragContext
          ? `\nLocal Recycling Regulations (from official sources):\n${ragContext}\n\nUse these official regulations as the primary source for determining recyclability and disposal instructions.`
          : ''
        }

IMPORTANT: First, identify the item from the user's description. Determine:
- What is the item? (e.g., "plastic water bottle", "aluminum can", "cardboard box", "lithium battery")
- What is the primary material? (e.g., "plastic", "aluminum", "cardboard", "battery")
- What category does it belong to? (e.g., "plastic-container", "metal-can", "paper-cardboard", "e-waste", "hazardous-waste")
- What is its condition? (e.g., "clean and empty", "partially full", "soiled with food", "broken")

Then:
1. Determine if this item is recyclable (true/false)
2. Identify the category it belongs to
3. Determine which bin it should go in (recycling, landfill, compost, hazardous, or unknown)
4. Provide clear, step-by-step instructions for proper disposal
5. Use web search to find 3-5 nearby recycling and disposal facilities in ${location}.
6. Return your complete analysis as a JSON object matching this exact structure:
{
  "isRecyclable": boolean,
  "category": string,
  "bin": "recycling" | "landfill" | "compost" | "hazardous" | "unknown",
  "confidence": number (0-1),
  "materialDescription": string,
  "instructions": string[],
  "reasoning": string,
  "locationUsed": string,
  "facilities": [{
    "name": string,
    "type": string,
    "address": string,
    "url": string,
    "notes": string,
    "email": string,
    "phone": string,
    "hours": string
  }],
  "webSearchSources": string[]
}

IMPORTANT: Include a "webSearchSources" array with URLs of web pages you consulted for recycling information (not just facilities). This should include any websites you used to determine recyclability, disposal methods, or general recycling guidelines. Include the full URLs of the sources you used.

STRICT FORMATTING RULES (MANDATORY):
- Do NOT include URLs anywhere in:
  - "reasoning"
  - "instructions"
  - "materialDescription"
  - facilities[].notes
- Do NOT include markdown links, parenthesized URLs, or split-line links.
- Do NOT include patterns like:
  - [domain] (https://example.com)
  - domain (https://example.com)
  - https://example.com
- If you want to reference a source in text, write ONLY the bare domain name
  (example: tompkinscountyny.gov) with NO link and NO parentheses.
- ALL URLs must appear ONLY in:
  - "webSearchSources"
  - facilities[].url
Violating these rules is an error.


Search for queries like "recycling facilities ${location}" or "[material] disposal ${location}" to find local facilities. For each facility in "facilities", the "url" field must be the canonical homepage URL exactly as shown in the browser address bar of the facility’s official website. Do NOT guess URLs. Do NOT modify protocol (http/https) or add/remove "www". If the exact official website URL cannot be confidently verified, return a string "#". 

For the last three fields in "facilities", try to find each facility's contact information like email address, phone number, and hours of operation. Every facility object must include all fields listed above. If email, phone, or hours are unavailable, return them as empty strings (""). Do NOT omit fields. Do NOT use null.`;
    }

    const tools: any[] = [{ type: 'web_search' as const }];
    if (Object.keys(userLocation).length > 1) {
      tools[0].user_location = userLocation;
    }

    const response = await openai.responses.create({
      model: 'gpt-4.1',
      tools,
      input,
    });

    const outputText = response.output_text || '';
    if (!outputText) throw new Error('No output text from Responses API');

    const parsed = extractJSONFromResponse(outputText);

    // Ground web sources from the actual web_search tool results (avoid hallucinated URLs).
    const webSearchSourcesFromTools = extractWebSearchUrlsFromResponse(response);

    const webSearchSourcesFromModel: string[] = Array.isArray(parsed.webSearchSources)
      ? parsed.webSearchSources
        .filter((u: any) => typeof u === 'string')
        .map((u: string) => u.trim())
        .filter((u: string) => u.length > 0)
      : [];

    const webSearchSources =
      webSearchSourcesFromTools.length > 0 ? webSearchSourcesFromTools : webSearchSourcesFromModel;

    // Sanitize ALL user-visible strings here (single source of truth)
    const sanitizedFacilities: Facility[] = Array.isArray(parsed.facilities)
      ? parsed.facilities
        .map((f: any) => ({
          name: stripLinks(f?.name || 'Unknown Facility'),
          type: stripLinks(f?.type || 'Recycling Center'),
          address: stripLinks(f?.address || 'Address not available'),
          url: normalizeFacilityUrl(f.url) || '#', // URLs allowed here
          notes: stripLinks(f?.notes || ''),
          email: typeof f.email === 'string' ? f.email : '',
        phone: typeof f.phone === 'string' ? f.phone : '', //extra check since phone numbers + hours could be returned as a weird type
        hours: typeof f.hours === 'string' ? f.hours : '',
        }))
        .slice(0, 5)
      : [];

    const result: AnalyzeResponse = {
      isRecyclable: Boolean(parsed.isRecyclable),
      category: stripLinks(parsed.category || visionResult?.category || 'unknown'),
      bin: parsed.bin || 'unknown',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,

      materialDescription: stripLinks(
        parsed.materialDescription || visionResult?.shortDescription || context || 'Item description not available'
      ),

      instructions: stripLinksFromArray(parsed.instructions),
      reasoning: stripLinks(parsed.reasoning || 'Analysis completed'),
      locationUsed: stripLinks(parsed.locationUsed || location),

      facilities: sanitizedFacilities,

      ragSources: Array.isArray(ragSources) && ragSources.length > 0 ? ragSources : undefined,
      ragQueried,
      webSearchSources: webSearchSources.length > 0 ? webSearchSources : undefined,
    };

    return result;
  } catch (error) {
    console.error('GPT service error:', error);
    throw new Error(
      `Failed to analyze recyclability: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
