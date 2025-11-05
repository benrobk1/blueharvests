/**
 * DRIVER FEATURE ERROR TYPES
 * Feature-specific error creators for driver operations
 * 
 * @module features/drivers/errors
 * @description Type-safe error creators for driver-related failures including
 * route claims, delivery updates, box scanning, and payouts.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed route claim operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createRouteClaimError = (message = 'Failed to claim route'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Route claim operation failed');

/**
 * Creates error for failed delivery status update
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createDeliveryError = (message = 'Failed to update delivery status'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Delivery update failed');

/**
 * Creates error for invalid box code scan
 * @param message - Optional custom error message
 * @returns BaseAppError with VALIDATION_ERROR code
 */
export const createBoxScanError = (message = 'Invalid box code'): BaseAppError =>
  new BaseAppError(ErrorCode.VALIDATION_ERROR, message, 'Box code scan validation failed');

/**
 * Creates error for failed driver payout data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createDriverPayoutError = (message = 'Failed to load payout information'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Driver payout data fetch failed');
