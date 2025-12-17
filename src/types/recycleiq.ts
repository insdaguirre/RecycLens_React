export interface AnalyzeRequest {
  image?: string; // base64-encoded image (optional - either image or context required)
  location: string;
  context: string;
}

export interface VisionResponse {
  primaryMaterial: string;
  secondaryMaterials: string[];
  category: string;
  condition: string;
  contaminants: string[];
  confidence: number;
  shortDescription: string;
}

export interface Facility {
  name: string;
  type: string;
  address: string;
  url: string;
  notes: string;
  email:string;
  phone:string;
  hours:string;
  coordinates?: [number, number]; // [longitude, latitude] - optional for MVP
}

export type BinType = 'recycling' | 'landfill' | 'compost' | 'hazardous' | 'unknown';

export interface AnalyzeResponse {
  isRecyclable: boolean;
  category: string;
  bin: BinType;
  confidence: number;
  materialDescription?: string;
  instructions: string[];
  reasoning: string;
  locationUsed: string;
  facilities: Facility[];
  ragSources?: string[];
  ragQueried?: boolean;
  webSearchSources?: string[];
}

export type AnalysisStage = 
  | 'idle' 
  | 'analyzing-vision' 
  | 'querying-rag' 
  | 'analyzing-recyclability' 
  | 'geocoding' 
  | 'complete' 
  | 'error';

export interface AnalyzeState {
  loading: boolean;
  error: string | null;
  data: AnalyzeResponse | null;
  stage: AnalysisStage;
}

// Chat types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  analysisData?: AnalyzeResponse;
  location?: string;
  material?: string;
  visionData?: VisionResponse;
}

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  context: ChatContext | null;
}

