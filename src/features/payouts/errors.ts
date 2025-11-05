/**
 * PAYOUT FEATURE ERROR TYPES
 * Feature-specific error creators for payout operations
 * 
 * @module features/payouts/errors
 * @description Type-safe error creators for payout-related failures including
 * loading payout data, processing payouts, and fetching payout history.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed payout data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createPayoutLoadError = (message = 'Failed to load payout information'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Payout data fetch failed');

/**
 * Creates error for failed payout processing
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createPayoutProcessError = (message = 'Failed to process payout'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Payout processing failed');

/**
 * Creates error for failed payout history load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createPayoutHistoryError = (message = 'Failed to load payout history'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Payout history data fetch failed');
