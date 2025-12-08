import { Check, X } from 'lucide-react';
import type { AnalyzeResponse } from '../types/recycleiq';
import ChatCard from './ChatCard';

interface ResultsPanelProps {
  data: AnalyzeResponse;
  isVisible: boolean;
  onChatClick?: () => void;
}

export default function ResultsPanel({ data, isVisible, onChatClick }: ResultsPanelProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 transition-all duration-700 ease-in-out flex flex-col min-h-[600px]">
      <div className="text-center mb-6">
        <div
          className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            data.isRecyclable ? 'bg-green-100' : 'bg-red-100'
          }`}
        >
          {data.isRecyclable ? (
            <Check className="w-10 h-10 text-green-600" />
          ) : (
            <X className="w-10 h-10 text-red-600" />
          )}
        </div>
        <h3
          className={`text-3xl font-light mb-2 ${
            data.isRecyclable ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {data.isRecyclable ? 'Recyclable' : 'Not Recyclable'}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {data.reasoning || (data.isRecyclable 
            ? 'This item can be recycled' 
            : 'This item cannot be recycled')}
        </p>
      </div>

      {/* Category */}
      <div className="mb-6">
        <p className="text-xs font-medium text-gray-500 mb-3">CATEGORY</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {data.category}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {data.bin}
          </span>
          {data.materialDescription && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {data.materialDescription}
            </span>
          )}
        </div>
      </div>

      {/* Instructions */}
      {data.instructions && data.instructions.length > 0 && (
        <div className="mb-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-3">INSTRUCTIONS</p>
          <ol className="list-decimal list-inside space-y-2">
            {data.instructions.map((instruction, index) => (
              <li key={index} className="text-sm text-gray-700 leading-relaxed">
                {instruction}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Confidence */}
      <div className="pt-6 border-t border-gray-100 mb-6">
        <p className="text-xs font-medium text-gray-500 mb-2">CONFIDENCE</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Chat Card - fills remaining space */}
      {onChatClick && (
        <div className="mt-auto">
          <ChatCard onClick={onChatClick} />
        </div>
      )}
    </div>
  );
}

