/**
 * ORDER QUERIES
 * Query factory pattern for order-related queries
 * Centralized query key management for TanStack Query
 */

import { OrderStatus } from '@/types/domain/order';

export const orderQueries = {
  // Base key for all order queries
  all: () => ['orders'] as const,
  
  // List queries
  lists: () => [...orderQueries.all(), 'list'] as const,
  list: (userId?: string) => [...orderQueries.lists(), userId] as const,
  
  // Individual order details
  details: () => [...orderQueries.all(), 'detail'] as const,
  detail: (orderId: string) => [...orderQueries.details(), orderId] as const,
  
  // Active order (consumer view)
  active: (userId: string) => [...orderQueries.all(), 'active', userId] as const,
  
  // Orders by status
  byStatus: (status: OrderStatus, userId?: string) => 
    [...orderQueries.all(), 'status', status, userId] as const,
  
  // Orders by delivery date
  byDeliveryDate: (date: string, userId?: string) => 
    [...orderQueries.all(), 'delivery-date', date, userId] as const,
  
  // Order history (consumer view)
  history: (userId: string) => [...orderQueries.all(), 'history', userId] as const,
  
  // Order items
  items: (orderId: string) => [...orderQueries.all(), 'items', orderId] as const,
  
  // Admin queries
  admin: {
    all: () => [...orderQueries.all(), 'admin'] as const,
    byStatus: (status: OrderStatus) => 
      [...orderQueries.admin.all(), 'status', status] as const,
    pending: () => [...orderQueries.admin.all(), 'pending'] as const,
    recent: () => [...orderQueries.admin.all(), 'recent'] as const,
  },
};
