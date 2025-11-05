/**
 * CONSUMER FEATURE ERROR TYPES
 * Feature-specific error creators for consumer operations
 * 
 * @module features/consumers/errors
 * @description Type-safe error creators for consumer-related failures including
 * referrals, subscriptions, credits, and ratings.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed referral processing
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createReferralError = (message = 'Failed to process referral'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Referral operation failed');

/**
 * Creates error for failed subscription management
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createSubscriptionError = (message = 'Failed to manage subscription'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Subscription operation failed');

/**
 * Creates error for failed credits data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createCreditsError = (message = 'Failed to load credits information'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Credits data fetch failed');

/**
 * Creates error for failed rating submission
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createRatingError = (message = 'Failed to submit rating'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Rating submission failed');
