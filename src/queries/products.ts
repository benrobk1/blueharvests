/**
 * PRODUCT QUERIES
 * Query factory pattern for product-related queries
 * Centralized query key management for TanStack Query
 */

import { ProductFilters, ProductSortField, SortDirection } from '@/types/domain/product';

export const productQueries = {
  // Base key for all product queries
  all: () => ['products'] as const,
  
  // List queries with filters
  lists: () => [...productQueries.all(), 'list'] as const,
  list: (filters?: ProductFilters) => [...productQueries.lists(), filters] as const,
  
  // Approved products (for shop display)
  approved: () => [...productQueries.all(), 'approved'] as const,
  approvedList: (filters?: ProductFilters) => [...productQueries.approved(), filters] as const,
  
  // Products by farm
  byFarm: (farmId: string) => [...productQueries.all(), 'farm', farmId] as const,
  byFarmList: (farmId: string, filters?: ProductFilters) => 
    [...productQueries.byFarm(farmId), filters] as const,
  
  // Individual product details
  details: () => [...productQueries.all(), 'detail'] as const,
  detail: (productId: string) => [...productQueries.details(), productId] as const,
  
  // Pending approval (admin view)
  pendingApproval: () => [...productQueries.all(), 'pending-approval'] as const,
  
  // Search queries
  search: (query: string) => [...productQueries.all(), 'search', query] as const,
  
  // Sorted queries
  sorted: (sortField: ProductSortField, direction: SortDirection) => 
    [...productQueries.all(), 'sorted', sortField, direction] as const,
};
