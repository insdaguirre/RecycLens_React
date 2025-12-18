/**
 * Location service for autocomplete and geolocation
 */

export interface LocationSuggestion {
  id: string;
  name: string; // Short name like "Ithaca, NY"
  fullAddress: string; // Full address
  coordinates: [number, number]; // [longitude, latitude]
  placeType: string[]; // Type of place (city, postcode, etc.)
}

class LocationService {
  private readonly STORAGE_KEY = 'recyclens_last_location';
  private readonly MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  /**
   * Search for location suggestions using Mapbox Geocoding API
   */
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (query.length < 2) return [];

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      const params = new URLSearchParams({
        access_token: this.MAPBOX_TOKEN,
        types: 'place,postcode,locality,neighborhood', // City-level results
        country: 'US', // Limit to US (remove for international)
        limit: '5',
        autocomplete: 'true',
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.features.map((feature: any) => ({
        id: feature.id,
        name: this.formatShortName(feature.place_name),
        fullAddress: feature.place_name,
        coordinates: feature.center,
        placeType: feature.place_type,
      }));
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  }

  /**
   * Get current location using browser Geolocation API
   * and reverse geocode to get address
   */
  async getCurrentLocation(): Promise<LocationSuggestion | null> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Reverse geocode coordinates to address
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;
            const params = new URLSearchParams({
              access_token: this.MAPBOX_TOKEN,
              types: 'place,postcode,locality',
              limit: '1',
            });

            const response = await fetch(`${url}?${params}`);

            if (!response.ok) {
              throw new Error(`Mapbox API error: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.features.length > 0) {
              const feature = data.features[0];
              resolve({
                id: feature.id,
                name: this.formatShortName(feature.place_name),
                fullAddress: feature.place_name,
                coordinates: [longitude, latitude],
                placeType: feature.place_type,
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          // Handle geolocation errors
          let message = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access in your browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }

  /**
   * Save last used location to localStorage
   */
  saveLastLocation(location: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, location);
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  }

  /**
   * Get last used location from localStorage
   */
  getLastLocation(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to get last location:', error);
      return null;
    }
  }

  /**
   * Clear saved location
   */
  clearLastLocation(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear location:', error);
    }
  }

  /**
   * Format full address to short name (e.g., "Ithaca, NY")
   */
  private formatShortName(fullAddress: string): string {
    // Take first two parts of address (city, state/country)
    const parts = fullAddress.split(',').map(p => p.trim());

    if (parts.length >= 2) {
      // For US addresses, extract state code if present
      const secondPart = parts[1];
      const stateMatch = secondPart.match(/\b([A-Z]{2})\b/);

      if (stateMatch) {
        return `${parts[0]}, ${stateMatch[1]}`;
      }

      return `${parts[0]}, ${parts[1]}`;
    }

    return parts[0] || fullAddress;
  }
}

// Export singleton instance
export const locationService = new LocationService();
