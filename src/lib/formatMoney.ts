/**
 * Formats a number as US currency
 * 
 * @param amount - Dollar amount to format
 * @returns Formatted currency string (e.g., "$12.50")
 * 
 * @example
 * ```typescript
 * formatMoney(12.5) // "$12.50"
 * formatMoney(1000) // "$1,000.00"
 * ```
 */
export const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
