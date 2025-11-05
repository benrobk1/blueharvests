/**
 * Structured address components
 */
export interface StructuredAddress {
  /** Street address line */
  street_address: string;
  /** City name */
  city: string;
  /** Two-letter state code */
  state: string;
  /** Five-digit ZIP code */
  zip_code: string;
  /** Optional country (defaults to US) */
  country?: string;
}

/**
 * Formats structured address into a complete address string
 * 
 * @param addr - Structured address object
 * @returns Full address string (e.g., "123 Main St, Springfield, IL 62701")
 * 
 * @example
 * ```typescript
 * formatFullAddress({
 *   street_address: "123 Main St",
 *   city: "Springfield",
 *   state: "IL",
 *   zip_code: "62701"
 * }) // "123 Main St, Springfield, IL 62701"
 * ```
 */
export const formatFullAddress = (addr: StructuredAddress): string => {
  const parts = [
    addr.street_address,
    addr.city,
    `${addr.state} ${addr.zip_code}`
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * Formats address into a short city/state/zip format
 * 
 * @param addr - Structured address object
 * @returns Short address string (e.g., "Springfield, IL 62701")
 */
export const formatShortAddress = (addr: StructuredAddress): string => {
  return `${addr.city}, ${addr.state} ${addr.zip_code}`;
};

/**
 * Parses a full address string into structured components
 * 
 * @param fullAddress - Complete address string to parse
 * @returns Partial structured address (may be incomplete if parsing fails)
 * 
 * @example
 * ```typescript
 * parseAddress("123 Main St, Springfield, IL 62701")
 * // { street_address: "123 Main St", city: "Springfield", state: "IL", zip_code: "62701" }
 * ```
 */
export const parseAddress = (fullAddress: string): Partial<StructuredAddress> => {
  if (!fullAddress) return {};
  
  // Basic parsing for migration: "123 Main St, Springfield, IL 62701"
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length < 2) {
    return { street_address: fullAddress };
  }
  
  const lastPart = parts[parts.length - 1];
  const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5})/);
  
  return {
    street_address: parts[0] || '',
    city: parts[1] || '',
    state: stateZipMatch ? stateZipMatch[1] : '',
    zip_code: stateZipMatch ? stateZipMatch[2] : '',
  };
};
