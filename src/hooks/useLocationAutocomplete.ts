import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService, type LocationSuggestion } from '../services/locationService';

export function useLocationAutocomplete(initialValue: string = '') {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track the latest query for debouncing
  const latestQueryRef = useRef(query);

  // Update ref when query changes
  useEffect(() => {
    latestQueryRef.current = query;
  }, [query]);

  // Debounced search effect
  useEffect(() => {
    // Clear suggestions if query is too short
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce: wait 300ms before searching
    const timer = setTimeout(async () => {
      // Only proceed if this is still the latest query
      if (latestQueryRef.current === query) {
        try {
          const results = await locationService.searchLocations(query);

          // Check again in case query changed during fetch
          if (latestQueryRef.current === query) {
            setSuggestions(results);
            setIsOpen(results.length > 0);
          }
        } catch (err) {
          console.error('Location search failed:', err);
          setError('Failed to search locations. Please try again.');
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [query]);

  /**
   * Select a suggestion from the dropdown
   */
  const selectSuggestion = useCallback((suggestion: LocationSuggestion) => {
    setQuery(suggestion.name);
    setSuggestions([]);
    setIsOpen(false);
    locationService.saveLastLocation(suggestion.name);
  }, []);

  /**
   * Use browser's geolocation to get current location
   */
  const useCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await locationService.getCurrentLocation();

      if (location) {
        setQuery(location.name);
        setSuggestions([]);
        setIsOpen(false);
        locationService.saveLastLocation(location.name);
      } else {
        setError('Could not determine your location');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get current location';
      setError(message);
      console.error('Geolocation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear the current query and suggestions
   */
  const clearQuery = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setError(null);
  }, []);

  /**
   * Load last used location on mount
   */
  useEffect(() => {
    if (!initialValue) {
      const lastLocation = locationService.getLastLocation();
      if (lastLocation) {
        setQuery(lastLocation);
      }
    }
  }, []); // Only run once on mount

  return {
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
  };
}
