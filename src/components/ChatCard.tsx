import { MessageCircle } from 'lucide-react';

interface ChatCardProps {
  onClick: () => void;
}

export default function ChatCard({ onClick }: ChatCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 p-6 hover:from-green-100 hover:to-green-200 transition-all flex flex-col items-center justify-center gap-3 text-left group"
    >
      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
        <MessageCircle className="w-6 h-6 text-white" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Ask Questions</h3>
        <p className="text-sm text-gray-600">
          Chat with our AI assistant about this item
        </p>
      </div>
    </button>
  );
}

