/**
 * FARMER FEATURE ERROR TYPES
 * Feature-specific error creators for farmer operations
 * 
 * @module features/farmers/errors
 * @description Type-safe error creators for farmer-related failures including
 * products, inventory, CSV imports, batches, payouts, and Stripe Connect.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed product save operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createProductError = (message = 'Failed to save product'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Product operation failed');

/**
 * Creates error for failed inventory update
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createInventoryError = (message = 'Failed to update inventory'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Inventory update failed');

/**
 * Creates error for failed CSV import with optional validation context
 * @param message - Optional custom error message
 * @param context - Optional validation error details
 * @returns BaseAppError with VALIDATION_ERROR code
 */
export const createCSVImportError = (message = 'Failed to import CSV file', context?: Record<string, unknown>): BaseAppError =>
  new BaseAppError(ErrorCode.VALIDATION_ERROR, message, 'CSV import validation failed', context);

/**
 * Creates error for invalid file type
 * @param message - Optional custom error message
 * @returns BaseAppError with VALIDATION_ERROR code
 */
export const createInvalidFileError = (message = 'Invalid file type'): BaseAppError =>
  new BaseAppError(ErrorCode.VALIDATION_ERROR, message, 'File validation failed');

/**
 * Creates error for failed batch processing
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createBatchError = (message = 'Failed to process batch'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Batch operation failed');

/**
 * Creates error for failed farmer payout data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createFarmerPayoutError = (message = 'Failed to load payout information'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Farmer payout data fetch failed');

/**
 * Creates error for failed Stripe Connect operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createStripeConnectError = (message = 'Failed to connect Stripe account'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Stripe Connect operation failed');
