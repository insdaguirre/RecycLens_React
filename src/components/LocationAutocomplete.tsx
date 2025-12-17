import { useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, X, AlertCircle } from 'lucide-react';
import { useLocationAutocomplete } from '../hooks/useLocationAutocomplete';
import type { LocationSuggestion } from '../services/locationService';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter your city or ZIP code',
  required = true,
}: LocationAutocompleteProps) {
  const {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    setIsOpen,
    error,
    selectSuggestion,
    useCurrentLocation,
    clearQuery,
  } = useLocationAutocomplete(value);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync query with parent value
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Notify parent of changes
  useEffect(() => {
    onChange(query);
  }, [query, onChange]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    selectSuggestion(suggestion);
  };

  const handleClearClick = () => {
    clearQuery();
  };

  const handleCurrentLocationClick = async () => {
    await useCurrentLocation();
  };

  return (
    <div className="mb-6" ref={containerRef}>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Location {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        {/* Main Input with Autocomplete */}
        <div className="relative flex-1">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />

          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900"
            autoComplete="off"
          />

          {/* Loading Spinner or Clear Button */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={handleClearClick}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {suggestion.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.fullAddress}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocationClick}
          disabled={isLoading}
          className="px-4 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          title="Use my current location"
        >
          <Navigation className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {!error && (
        <div className="mt-2 text-xs text-gray-500">
          Start typing for suggestions or click the location button to use your current location
        </div>
      )}
    </div>
  );
}
