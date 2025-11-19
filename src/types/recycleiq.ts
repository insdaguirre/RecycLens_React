export interface AnalyzeRequest {
  image: string; // base64-encoded image
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
}

export interface AnalyzeState {
  loading: boolean;
  error: string | null;
  data: AnalyzeResponse | null;
}

