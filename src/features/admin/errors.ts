/**
 * ADMIN FEATURE ERROR TYPES
 * Feature-specific error creators for admin operations
 * 
 * @module features/admin/errors
 * @description Type-safe error creators for admin-related failures including
 * role management, credits, KPIs, user approvals, and tax documents.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed admin role update
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createAdminRoleError = (message = 'Failed to update user role'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Admin role operation failed');

/**
 * Creates error for failed credits management
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createCreditsError = (message = 'Failed to manage credits'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Credits management failed');

/**
 * Creates error for failed KPI/metrics load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createKPIError = (message = 'Failed to load dashboard metrics'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'KPI data fetch failed');

/**
 * Creates error for failed user approval
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createUserApprovalError = (message = 'Failed to approve user'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'User approval operation failed');

/**
 * Creates error for failed tax document generation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createTaxDocumentError = (message = 'Failed to generate tax document'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Tax document generation failed');
