import React, { useEffect, useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import type { Facility } from '../types/recycleiq';
import { geocodeAddress } from '../utils/geocoding';
import { Loader2, MapPin, ExternalLink } from 'lucide-react';

interface FacilityMapProps {
  facilities: Facility[];
  userLocation?: string;
  onMarkerClick?: (facility: Facility) => void;
}

interface FacilityWithCoords extends Facility {
  coordinates: [number, number];
}

export default function FacilityMap({ facilities, userLocation, onMarkerClick }: FacilityMapProps) {
  const [facilitiesWithCoords, setFacilitiesWithCoords] = useState<FacilityWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithCoords | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Get Mapbox token from environment variable (Vite requires VITE_ prefix)
  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

  // Geocode facilities on mount or when facilities change
  useEffect(() => {
    if (!mapboxToken) {
      setError('Mapbox access token is not configured');
      setLoading(false);
      return;
    }

    if (facilities.length === 0) {
      setLoading(false);
      return;
    }

    const geocodeFacilities = async () => {
      setLoading(true);
      setError(null);

      try {
        const facilitiesWithCoordinates: FacilityWithCoords[] = [];

        // Geocode each facility address
        for (const facility of facilities) {
          // If facility already has coordinates, use them
          if (facility.coordinates && facility.coordinates.length === 2) {
            facilitiesWithCoordinates.push({
              ...facility,
              coordinates: facility.coordinates,
            });
            continue;
          }

          // Otherwise, geocode the address
          const coordinates = await geocodeAddress(facility.address, mapboxToken);
          if (coordinates) {
            facilitiesWithCoordinates.push({
              ...facility,
              coordinates,
            });
          }
        }

        setFacilitiesWithCoords(facilitiesWithCoordinates);
      } catch (err) {
        console.error('Error geocoding facilities:', err);
        setError('Failed to load facility locations');
      } finally {
        setLoading(false);
      }
    };

    geocodeFacilities();
  }, [facilities, mapboxToken]);

  // Geocode user location if provided
  useEffect(() => {
    if (!userLocation || !mapboxToken) return;

    const geocodeUserLocation = async () => {
      const coords = await geocodeAddress(userLocation, mapboxToken);
      if (coords) {
        setUserCoords(coords);
      }
    };

    geocodeUserLocation();
  }, [userLocation, mapboxToken]);

  // Calculate initial viewport
  const initialViewport = useMemo(() => {
    if (facilitiesWithCoords.length === 0 && !userCoords) {
      // Default to a reasonable center (US center)
      return {
        longitude: -98.5795,
        latitude: 39.8283,
        zoom: 3,
      };
    }

    if (facilitiesWithCoords.length === 0 && userCoords) {
      return {
        longitude: userCoords[0],
        latitude: userCoords[1],
        zoom: 12,
      };
    }

    // Calculate bounds from facilities
    const lngs = facilitiesWithCoords.map(f => f.coordinates[0]);
    const lats = facilitiesWithCoords.map(f => f.coordinates[1]);

    if (userCoords) {
      lngs.push(userCoords[0]);
      lats.push(userCoords[1]);
    }

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calculate zoom level based on bounds
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);
    
    let zoom = 10;
    if (maxDiff > 1) zoom = 6;
    else if (maxDiff > 0.5) zoom = 8;
    else if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 12;
    else zoom = 14;

    return {
      longitude: centerLng,
      latitude: centerLat,
      zoom,
    };
  }, [facilitiesWithCoords, userCoords]);

  const [viewport, setViewport] = useState(initialViewport);

  // Update viewport when initial viewport changes
  useEffect(() => {
    setViewport(initialViewport);
  }, [initialViewport]);

  if (!mapboxToken) {
    return (
      <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">Mapbox token not configured</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (facilitiesWithCoords.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">No facilities to display on map</p>
      </div>
    );
  }

  return (
    <div className="h-96 rounded-2xl overflow-hidden relative">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={viewport}
        onMove={evt => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
      >
        {/* User location marker */}
        {userCoords && (
          <Marker longitude={userCoords[0]} latitude={userCoords[1]}>
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </Marker>
        )}

        {/* Facility markers */}
        {facilitiesWithCoords.map((facility, index) => (
          <Marker
            key={index}
            longitude={facility.coordinates[0]}
            latitude={facility.coordinates[1]}
            anchor="bottom"
          >
            <button
              onClick={() => {
                setSelectedFacility(facility);
                if (onMarkerClick) {
                  onMarkerClick(facility);
                }
              }}
              className="w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer"
              aria-label={facility.name}
            >
              <MapPin className="w-4 h-4 text-white" />
            </button>
          </Marker>
        ))}

        {/* Popup for selected facility */}
        {selectedFacility && (
          <Popup
            longitude={selectedFacility.coordinates[0]}
            latitude={selectedFacility.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedFacility(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-medium text-gray-900 mb-1">{selectedFacility.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{selectedFacility.address}</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                  {selectedFacility.type}
                </span>
                {selectedFacility.url && selectedFacility.url !== '#' && (
                  <a
                    href={selectedFacility.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Directions
                  </a>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

