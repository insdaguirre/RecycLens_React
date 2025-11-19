import { Router, type Request, type Response } from 'express';
import { analyzeImage } from '../services/visionService.js';
import { analyzeRecyclability } from '../services/gpt5Service.js';
import type { AnalyzeRequest } from '../types.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { image, location, context }: AnalyzeRequest = req.body;

    // Validate request
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image (base64) is required' });
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Context is optional, default to empty string
    const contextValue = context || '';

    // Step 1: Analyze image with Vision API
    const visionResult = await analyzeImage(image);

    // Step 2: Analyze recyclability with GPT-5 + web search
    const analysisResult = await analyzeRecyclability(
      visionResult,
      contextValue,
      location
    );

    // Return combined result
    res.json(analysisResult);
  } catch (error) {
    console.error('Analyze route error:', error);
    res.status(500).json({
      error: 'Failed to analyze item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

