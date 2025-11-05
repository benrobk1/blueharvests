/**
 * ADMIN QUERIES
 * Query factory pattern for admin-related queries
 * Centralized query key management for TanStack Query
 */

export const adminQueries = {
  // Base key for all admin queries
  all: () => ['admin'] as const,
  
  // Admin users
  admins: () => [...adminQueries.all(), 'admins'] as const,
  
  // Lead farmers management
  leadFarmers: () => [...adminQueries.all(), 'lead-farmers'] as const,
  allFarms: () => [...adminQueries.all(), 'all-farms'] as const,
  
  // KPIs and metrics
  kpis: () => [...adminQueries.all(), 'kpis'] as const,
  metrics: () => [...adminQueries.all(), 'metrics'] as const,
  analyticsFinancials: () => [...adminQueries.all(), 'analytics-financials'] as const,
  
  // Audit and logs
  auditLogs: () => [...adminQueries.all(), 'audit-logs'] as const,
  recentActivity: () => [...adminQueries.all(), 'recent-activity'] as const,
  
  // Batches
  batches: () => [...adminQueries.all(), 'batches'] as const,
  availableDrivers: () => [...adminQueries.all(), 'available-drivers'] as const,
  
  // Credits
  creditsHistory: () => [...adminQueries.all(), 'credits-history'] as const,
  
  // Drivers
  liveDrivers: () => [...adminQueries.all(), 'live-drivers'] as const,
  
  // Disputes
  disputes: () => [...adminQueries.all(), 'disputes'] as const,
  
  // User approvals
  pendingUsers: () => [...adminQueries.all(), 'pending-users'] as const,
  userSearch: (searchTerm: string, roleFilter: string, statusFilter: string) => 
    [...adminQueries.all(), 'user-search', searchTerm, roleFilter, statusFilter] as const,
};
