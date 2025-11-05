/**
 * CONSUMER QUERIES
 * Query factory pattern for consumer-related queries
 * Centralized query key management for TanStack Query
 */

export const consumerQueries = {
  // Base key for all consumer queries
  all: () => ['consumers'] as const,
  
  // Profile
  profile: (userId?: string) => ['profile', userId] as const,
  
  // Credits
  credits: (userId: string) => ['credits', userId] as const,
  creditsBreakdown: (userId: string) => ['credits-breakdown', userId] as const,
  
  // Subscription
  subscription: (userId: string) => ['subscription-spending', userId] as const,
  
  // Orders
  orders: (userId: string) => ['consumer-orders', userId] as const,
  orderSuccess: (orderId: string) => ['order-success', orderId] as const,
  
  // Market config
  marketConfig: (zipCode?: string) => ['market-config', zipCode] as const,
};
