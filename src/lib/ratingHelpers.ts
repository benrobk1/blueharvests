/**
 * Minimum number of reviews required before displaying public rating
 */
export const MINIMUM_REVIEWS_THRESHOLD = 25;

/**
 * Determines if rating should be publicly displayed
 * 
 * @param reviewCount - Number of reviews received
 * @returns True if review count meets threshold
 */
export const shouldShowRating = (reviewCount: number): boolean => {
  return reviewCount >= MINIMUM_REVIEWS_THRESHOLD;
};

/**
 * Rating display information for UI
 */
export interface RatingDisplay {
  /** Rating value as string (e.g., "4.5" or "N/A") */
  rating: string;
  /** Total number of reviews */
  reviewCount: number;
  /** Whether to show the rating publicly */
  show: boolean;
  /** Progress towards minimum threshold (e.g., "15/25") */
  progress?: string;
}

/**
 * Gets formatted rating display data based on review count threshold
 * 
 * @param rating - Numeric rating value
 * @param reviewCount - Number of reviews
 * @returns Rating display object with formatted data
 * 
 * @example
 * ```typescript
 * getRatingDisplay(4.5, 30) 
 * // { rating: "4.5", reviewCount: 30, show: true }
 * 
 * getRatingDisplay(4.5, 10)
 * // { rating: "N/A", reviewCount: 10, show: false, progress: "10/25" }
 * ```
 */
export const getRatingDisplay = (rating: number, reviewCount: number): RatingDisplay => {
  if (reviewCount >= MINIMUM_REVIEWS_THRESHOLD) {
    return { 
      rating: rating.toFixed(1), 
      reviewCount, 
      show: true 
    };
  }
  return { 
    rating: "N/A", 
    reviewCount, 
    show: false,
    progress: `${reviewCount}/${MINIMUM_REVIEWS_THRESHOLD}`
  };
};
