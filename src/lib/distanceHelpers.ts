/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in miles (rounded to nearest mile)
 * 
 * @example
 * ```typescript
 * calculateDistance(40.7128, -74.0060, 34.0522, -118.2437) // NYC to LA ≈ 2451 miles
 * ```
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse location string in "Lat,Lng" format
 * 
 * @param location - Comma-separated latitude,longitude string
 * @returns Object with lat/lng numbers, or null if invalid
 * 
 * @example
 * ```typescript
 * parseLocation("40.7128,-74.0060") // { lat: 40.7128, lng: -74.0060 }
 * parseLocation("invalid") // null
 * ```
 */
export function parseLocation(location: string): { lat: number; lng: number } | null {
  if (!location) return null;
  
  const parts = location.split(',').map(p => parseFloat(p.trim()));
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
    return null;
  }
  
  return { lat: parts[0], lng: parts[1] };
}

/**
 * Approximate geocoding for US ZIP codes (basic approximation)
 * 
 * @description Simple ZIP to coordinates mapping for major metro areas.
 * In production, use a proper geocoding API.
 * 
 * @param zipCode - Five-digit US ZIP code
 * @returns Coordinates object or null if ZIP not in mapping
 * 
 * @example
 * ```typescript
 * getZipCodeCoordinates("10001") // { lat: 40.7506, lng: -73.9971 } (NYC)
 * getZipCodeCoordinates("99999") // null (not in mapping)
 * ```
 */
export function getZipCodeCoordinates(zipCode: string): { lat: number; lng: number } | null {
  // Simplified ZIP code to coordinates mapping (major metros)
  const zipMap: Record<string, { lat: number; lng: number }> = {
    '10001': { lat: 40.7506, lng: -73.9971 }, // NYC
    '10002': { lat: 40.7158, lng: -73.9865 },
    '10003': { lat: 40.7316, lng: -73.9890 },
    '94102': { lat: 37.7796, lng: -122.4193 }, // SF
    '90001': { lat: 33.9731, lng: -118.2479 }, // LA
    '60601': { lat: 41.8857, lng: -87.6181 }, // Chicago
  };
  
  return zipMap[zipCode] || null;
}

/**
 * Calculate distance from farm location to consumer ZIP code
 * 
 * @param farmLocation - Farm coordinates in "Lat,Lng" format
 * @param consumerZip - Consumer's five-digit ZIP code
 * @returns Distance in miles, or null if coordinates can't be determined
 * 
 * @example
 * ```typescript
 * calculateFarmToConsumerDistance("40.7128,-74.0060", "10001") // 2 (miles)
 * ```
 */
export function calculateFarmToConsumerDistance(
  farmLocation: string,
  consumerZip: string
): number | null {
  const farmCoords = parseLocation(farmLocation);
  const consumerCoords = getZipCodeCoordinates(consumerZip);
  
  if (!farmCoords || !consumerCoords) return null;
  
  return calculateDistance(
    farmCoords.lat,
    farmCoords.lng,
    consumerCoords.lat,
    consumerCoords.lng
  );
}
