/**
 * Revenue Model for Blue Harvests
 * 
 * Product Revenue Split (from listed price):
 * - 88% to farmer (all farmers affiliated with lead farmer)
 * - 2% to lead farmer (coordination fee)
 * - 10% platform fee
 * 
 * Delivery Fee:
 * - $7.50 flat fee per order (paid to driver)
 * - Added on top of product subtotal
 * - NOT percentage-based
 */

export interface RevenueSplit {
  farmerShare: number;      // Always 88%
  leadFarmerShare: number;  // Always 2%
  platformFee: number;      // Always 10%
}

/**
 * Calculate revenue split from product subtotal
 * All farmers are affiliated with lead farmers, so split is always 88/2/10
 */
export function calculateRevenueSplit(productSubtotal: number): RevenueSplit {
  return {
    farmerShare: productSubtotal * 0.88,
    leadFarmerShare: productSubtotal * 0.02,
    platformFee: productSubtotal * 0.10,
  };
}

/**
 * Delivery fee is FLAT $7.50 per order, not percentage-based
 */
export const FLAT_DELIVERY_FEE = 7.50;

/**
 * Calculate total driver payout for batch of deliveries
 * Each delivery has a flat $7.50 fee
 * @param deliveryCount - Number of deliveries in batch
 * @returns Total payout (flat fee × count)
 */
export function calculateDriverPayout(deliveryCount: number): number {
  return Number((deliveryCount * FLAT_DELIVERY_FEE).toFixed(2));
}
