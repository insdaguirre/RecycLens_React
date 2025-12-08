import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage } from '../utils/api';
import type { ChatMessage, ChatContext, ChatState } from '../types/recycleiq';

export function useChat(initialContext?: ChatContext) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    error: null,
    context: initialContext || null,
  });

  // Use ref to always have latest context and messages
  const contextRef = useRef(state.context);
  const messagesRef = useRef(state.messages);
  
  // Update refs when state changes
  useEffect(() => {
    contextRef.current = state.context;
    messagesRef.current = state.messages;
  }, [state.context, state.messages]);

  // Initialize with context if provided
  const initializeWithContext = useCallback((context: ChatContext) => {
    setState(prev => {
      contextRef.current = context;
      return {
        ...prev,
        context,
      };
    });
    
    // Add initial system message if context has analysis data
    if (context.analysisData) {
      const material = context.material || context.analysisData.materialDescription || 'item';
      const location = context.location || context.analysisData.locationUsed || '';
      
      const systemMessage: ChatMessage = {
        role: 'assistant',
        content: `I see you're asking about ${material}${location ? ` in ${location}` : ''}. I have information about this item from your previous analysis. How can I help you?`,
        timestamp: new Date(),
      };
      
      setState(prev => {
        const newMessages = [systemMessage];
        messagesRef.current = newMessages;
        return {
          ...prev,
          messages: newMessages,
        };
      });
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setState(prev => {
      const newMessages = [...prev.messages, userMessage];
      messagesRef.current = newMessages;
      return {
        ...prev,
        messages: newMessages,
        loading: true,
        error: null,
      };
    });

    try {
      // Get conversation history (last 10 messages for context)
      const conversationHistory = messagesRef.current.slice(-10);
      
      // Send message to API
      const response = await sendChatMessage(
        message.trim(),
        conversationHistory,
        contextRef.current || undefined
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };

      setState(prev => {
        const newMessages = [...prev.messages, assistantMessage];
        messagesRef.current = newMessages;
        return {
          ...prev,
          messages: newMessages,
          loading: false,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      
      setState(prev => {
        const newMessages = [...prev.messages, errorChatMessage];
        messagesRef.current = newMessages;
        return {
          ...prev,
          messages: newMessages,
        };
      });
    }
  }, []);

  const clearChat = useCallback(() => {
    contextRef.current = null;
    messagesRef.current = [];
    setState({
      messages: [],
      loading: false,
      error: null,
      context: null,
    });
  }, []);

  const setContext = useCallback((context: ChatContext | null) => {
    contextRef.current = context;
    setState(prev => ({
      ...prev,
      context,
    }));
  }, []);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    context: state.context,
    sendMessage,
    clearChat,
    setContext,
    initializeWithContext,
  };
}
