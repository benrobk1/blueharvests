/**
 * DRIVER QUERIES
 * Query factory pattern for driver-related queries
 * Centralized query key management for TanStack Query
 */

export const driverQueries = {
  // Base key for all driver queries
  all: () => ['drivers'] as const,
  
  // Driver profile
  profile: (userId?: string) => [...driverQueries.all(), 'profile', userId] as const,
  
  // Driver rating
  rating: (driverId: string) => [...driverQueries.all(), 'rating', driverId] as const,
  
  // Available routes for claiming
  availableRoutes: () => [...driverQueries.all(), 'available-routes'] as const,
  
  // Active route/batch
  activeRoute: (userId: string) => [...driverQueries.all(), 'active-route', userId] as const,
  activeBatch: (userId: string) => [...driverQueries.all(), 'active-batch', userId] as const,
  
  // Route stops
  routeStops: (batchId: string) => [...driverQueries.all(), 'route-stops', batchId] as const,
  
  // Delivery batch details
  deliveryBatch: (batchId: string) => [...driverQueries.all(), 'delivery-batch', batchId] as const,
  
  // Earnings and stats
  earnings: (userId: string) => [...driverQueries.all(), 'earnings', userId] as const,
  stats: (userId: string) => [...driverQueries.all(), 'stats', userId] as const,
  monthlyBatches: (userId: string) => [...driverQueries.all(), 'monthly-batches', userId] as const,
};
