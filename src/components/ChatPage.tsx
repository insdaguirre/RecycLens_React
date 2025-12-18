import { useState, useEffect, useRef, ComponentProps } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import type { ChatContext } from '../types/recycleiq';

interface ChatPageProps {
  initialContext?: ChatContext;
  onBack?: () => void;
}

export default function ChatPage({ initialContext, onBack }: ChatPageProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, error, sendMessage, initializeWithContext } = useChat(initialContext);

  // Initialize with context when component mounts or context changes
  useEffect(() => {
    if (initialContext) {
      initializeWithContext(initialContext);
    }
  }, [initialContext, initializeWithContext]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) {
      return;
    }

    const message = inputMessage;
    setInputMessage('');
    await sendMessage(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Add top padding to clear the sticky navbar */}
      <div className="max-w-4xl mx-auto px-6 pt-24 pb-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-3xl font-light text-gray-900">Chat with RecycLens</h1>
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[calc(100vh-250px)] flex flex-col overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg mb-2">Ask me anything about recycling!</p>
                <p className="text-sm">I can help with disposal questions, local regulations, and more.</p>
              </div>
            )}
            
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const markdownComponents = {
                p: ({ node, ...props }: ComponentProps<'p'> & { node?: unknown }) => (
                  <p className="mb-2 last:mb-0" {...props} />
                ),
                ul: ({ node, ...props }: ComponentProps<'ul'> & { node?: unknown }) => (
                  <ul className="list-disc pl-5 space-y-1 mb-2 last:mb-0" {...props} />
                ),
                ol: ({ node, ...props }: ComponentProps<'ol'> & { node?: unknown }) => (
                  <ol className="list-decimal pl-5 space-y-1 mb-2 last:mb-0" {...props} />
                ),
                li: ({ node, ...props }: ComponentProps<'li'> & { node?: unknown }) => (
                  <li className="leading-relaxed" {...props} />
                ),
                h1: ({ node, ...props }: ComponentProps<'h1'> & { node?: unknown }) => (
                  <h1 className="text-lg font-semibold mb-2" {...props} />
                ),
                h2: ({ node, ...props }: ComponentProps<'h2'> & { node?: unknown }) => (
                  <h2 className="text-base font-semibold mb-2" {...props} />
                ),
                h3: ({ node, ...props }: ComponentProps<'h3'> & { node?: unknown }) => (
                  <h3 className="text-sm font-semibold mb-2" {...props} />
                ),
                a: ({ node, ...props }: ComponentProps<'a'> & { node?: unknown }) => (
                  <a
                    className={`underline ${isUser ? 'text-white' : 'text-green-700'}`}
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                  />
                ),
                strong: ({ node, ...props }: ComponentProps<'strong'> & { node?: unknown }) => (
                  <strong className="font-semibold" {...props} />
                ),
              };

              return (
                <div
                  key={index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isUser
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <ReactMarkdown
                      className="text-sm leading-relaxed break-words space-y-2"
                      components={markdownComponents}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

