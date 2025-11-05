/**
 * PAYOUT QUERIES
 * Query factory pattern for payout-related queries
 * Centralized query key management for TanStack Query
 */

export const payoutQueries = {
  // Base key for all payout queries
  all: () => ['payouts'] as const,
  
  // Payout details by recipient type
  details: (userId: string, recipientType: 'farmer' | 'driver' | 'lead_farmer_commission') =>
    ['payout-details', userId, recipientType] as const,
  
  // Payout history
  history: (userId: string, recipientType: 'farmer' | 'driver' | 'lead_farmer_commission') =>
    ['payout-history', userId, recipientType] as const,
};
