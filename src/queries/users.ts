/**
 * USER QUERIES
 * Query factory pattern for user-related queries
 * Centralized query key management for TanStack Query
 */

import { UserRole, ApprovalStatus } from '@/types/domain/user';

export const userQueries = {
  // Base key for all user queries
  all: () => ['users'] as const,
  
  // Current user profile
  current: (userId?: string) => [...userQueries.all(), 'current', userId] as const,
  
  // Profile by ID
  profile: (userId: string) => [...userQueries.all(), 'profile', userId] as const,
  
  // User roles
  roles: (userId: string) => [...userQueries.all(), 'roles', userId] as const,
  
  // Consumer-specific
  consumer: {
    profile: (userId: string) => [...userQueries.all(), 'consumer', userId] as const,
    subscription: (userId: string) => 
      [...userQueries.all(), 'consumer', 'subscription', userId] as const,
    credits: (userId: string) => 
      [...userQueries.all(), 'consumer', 'credits', userId] as const,
  },
  
  // Farmer-specific
  farmer: {
    profile: (userId: string) => [...userQueries.all(), 'farmer', userId] as const,
    farmProfile: (farmId: string) => 
      [...userQueries.all(), 'farmer', 'farm-profile', farmId] as const,
    stripeStatus: (userId: string) => 
      [...userQueries.all(), 'farmer', 'stripe-status', userId] as const,
  },
  
  // Driver-specific
  driver: {
    profile: (userId: string) => [...userQueries.all(), 'driver', userId] as const,
    rating: (userId: string) => 
      [...userQueries.all(), 'driver', 'rating', userId] as const,
  },
  
  // Admin queries
  admin: {
    all: () => [...userQueries.all(), 'admin'] as const,
    byRole: (role: UserRole) => 
      [...userQueries.admin.all(), 'role', role] as const,
    byApprovalStatus: (status: ApprovalStatus) => 
      [...userQueries.admin.all(), 'approval-status', status] as const,
    pending: () => [...userQueries.admin.all(), 'pending'] as const,
  },
};
