import React, { useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  imagePreview?: string | null;
  onRemove?: () => void;
}

export default function ImageUpload({ onImageSelect, imagePreview, onRemove }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Allowed image formats
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

  const validateFile = (file: File): boolean => {
    // Check file type - only allow specific formats
    if (!allowedTypes.includes(file.type)) {
      setError('Only PNG, JPEG, GIF, and WebP formats are allowed');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('Image size must be less than 10MB');
      return false;
    }

    setError(null);
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onImageSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {imagePreview ? (
        <div className="relative">
          <div className="border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
          </div>
          {onRemove && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-2xl p-12 text-center bg-gray-50 transition-colors cursor-pointer ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:bg-gray-100'
          }`}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">Drop an image here or click to browse</p>
          <p className="text-sm text-gray-400">PNG, JPEG, GIF, or WebP only</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

