/**
 * CART FEATURE ERROR TYPES
 * Feature-specific error creators for cart operations
 * 
 * @module features/cart/errors
 * @description Type-safe error creators for cart-related failures including
 * add, remove, update, save, and load operations.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed add-to-cart operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createAddToCartError = (message = 'Failed to add item to cart'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Add to cart operation failed');

/**
 * Creates error for failed remove-from-cart operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createRemoveFromCartError = (message = 'Failed to remove item from cart'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Remove from cart operation failed');

/**
 * Creates error for failed cart update operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createUpdateCartError = (message = 'Failed to update cart'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Cart update operation failed');

/**
 * Creates error for failed cart save operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createSaveCartError = (message = 'Failed to save cart'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Cart save operation failed');

/**
 * Creates error for failed saved cart load operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createLoadCartError = (message = 'Failed to load saved cart'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Saved cart load operation failed');
