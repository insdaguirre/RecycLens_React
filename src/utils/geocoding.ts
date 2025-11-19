/**
 * Geocodes an address using Mapbox Geocoding API
 * @param address - The address to geocode
 * @param accessToken - Mapbox access token
 * @returns Promise resolving to [longitude, latitude] or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  accessToken: string
): Promise<[number, number] | null> {
  if (!accessToken) {
    console.error('Mapbox access token is required for geocoding');
    return null;
  }

  if (!address || address.trim().length === 0) {
    console.error('Address is required for geocoding');
    return null;
  }

  try {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);
    
    // Call Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Geocoding API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // Check if we have results
    if (!data.features || data.features.length === 0) {
      console.warn(`No geocoding results for address: ${address}`);
      return null;
    }

    // Extract coordinates [longitude, latitude]
    const coordinates = data.features[0].center;
    
    if (!coordinates || coordinates.length !== 2) {
      console.error('Invalid coordinates format from geocoding API');
      return null;
    }

    return [coordinates[0], coordinates[1]] as [number, number];
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocodes multiple addresses in batch
 * @param addresses - Array of addresses to geocode
 * @param accessToken - Mapbox access token
 * @returns Promise resolving to Map of address -> coordinates
 */
export async function geocodeAddresses(
  addresses: string[],
  accessToken: string
): Promise<Map<string, [number, number]>> {
  const results = new Map<string, [number, number]>();
  
  // Geocode addresses sequentially to avoid rate limiting
  for (const address of addresses) {
    const coordinates = await geocodeAddress(address, accessToken);
    if (coordinates) {
      results.set(address, coordinates);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

