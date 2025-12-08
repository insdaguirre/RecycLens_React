import { Router, type Request, type Response } from 'express';
import { sendChatMessage } from '../services/chatService.js';
import type { ChatMessage, ChatContext } from '../types.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, context }: {
      message: string;
      conversationHistory?: ChatMessage[];
      context?: ChatContext;
    } = req.body;

    // Validate request
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Send chat message
    const result = await sendChatMessage({
      message: message.trim(),
      conversationHistory,
      context,
    });

    // Return response
    res.json(result);
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      error: 'Failed to send chat message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

