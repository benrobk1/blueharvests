/**
 * FARMER QUERIES
 * Query factory pattern for farmer-related queries
 * Centralized query key management for TanStack Query
 */

export const farmerQueries = {
  // Base key for all farmer queries
  all: () => ['farmers'] as const,
  
  // Farmer profile
  profile: (userId: string) => [...farmerQueries.all(), 'profile', userId] as const,
  
  // Lead farmer specific
  leadFarmer: {
    batches: (userId: string) => [...farmerQueries.all(), 'lead-farmer-batches', userId] as const,
    info: (leadFarmerId: string) => [...farmerQueries.all(), 'lead-farmer-info', leadFarmerId] as const,
    collectionPoint: (userId: string) => [...farmerQueries.all(), 'collection-point', userId] as const,
  },
  
  // Affiliated farms
  affiliatedFarms: (userId: string) => [...farmerQueries.all(), 'affiliated-farms', userId] as const,
  affiliatedFarmersDetailed: (userId: string) => 
    [...farmerQueries.all(), 'affiliated-farmers-detailed', userId] as const,
  
  // Earnings
  aggregateEarnings: (userId: string) => [...farmerQueries.all(), 'aggregate-earnings', userId] as const,
  
  // Products
  products: (farmProfileId: string) => [...farmerQueries.all(), 'products', farmProfileId] as const,
  productsReview: (farmProfileId: string) => 
    [...farmerQueries.all(), 'products-review', farmProfileId] as const,
  
  // Orders
  orders: (farmProfileId: string) => [...farmerQueries.all(), 'orders', farmProfileId] as const,
  farmOrders: (farmProfileId: string) => [...farmerQueries.all(), 'farm-orders', farmProfileId] as const,
  
  // Stats
  stats: (userId: string) => [...farmerQueries.all(), 'stats', userId] as const,
  activeBatch: (userId: string) => [...farmerQueries.all(), 'active-batch', userId] as const,
  monthlyBatches: (userId: string) => [...farmerQueries.all(), 'monthly-batches', userId] as const,
  
  // Customer analytics
  customerAnalytics: (userId: string, isLeadFarmer: boolean) => 
    [...farmerQueries.all(), 'customer-analytics-zip', userId, isLeadFarmer] as const,
  customerSummary: (userId: string, displayZipData: any) => 
    [...farmerQueries.all(), 'customer-summary', userId, displayZipData] as const,
};
