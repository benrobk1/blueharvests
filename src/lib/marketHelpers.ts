/**
 * Checks if the current time has passed the order cutoff time
 * 
 * @param cutoffTime - Cutoff time in "HH:mm" format (e.g., "14:00")
 * @returns True if current time is past cutoff
 * 
 * @example
 * ```typescript
 * isCutoffPassed("14:00") // true if after 2pm
 * ```
 */
export function isCutoffPassed(cutoffTime: string): boolean {
  const now = new Date();
  const [hour, minute] = cutoffTime.split(':').map(Number);
  const cutoff = new Date();
  cutoff.setHours(hour, minute, 0, 0);
  return now >= cutoff;
}

/**
 * Calculates the next available delivery date based on cutoff time and delivery days
 * 
 * @param cutoffTime - Order cutoff time in "HH:mm" format
 * @param deliveryDays - Array of delivery day names (e.g., ["Monday", "Wednesday"])
 * @returns Next available delivery date
 * 
 * @example
 * ```typescript
 * getNextAvailableDate("14:00", ["Monday", "Friday"])
 * // Returns next Monday or Friday after cutoff
 * ```
 */
export function getNextAvailableDate(cutoffTime: string, deliveryDays: string[]): Date {
  const now = new Date();
  const [hour, minute] = cutoffTime.split(':').map(Number);
  
  let nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // If past cutoff today, start from tomorrow
  const cutoff = new Date();
  cutoff.setHours(hour, minute, 0, 0);
  if (now < cutoff) {
    nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + 1);
  } else {
    // Start from day after tomorrow if past cutoff
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Find next available delivery day
  while (!deliveryDays.includes(getDayName(nextDate))) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}
