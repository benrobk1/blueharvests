/**
 * ORDER FEATURE ERROR TYPES
 * Feature-specific error creators for order operations
 * 
 * @module features/orders/errors
 * @description Type-safe error creators for order-related failures including
 * checkout, payment, tracking, and cancellation operations.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed checkout operation
 * @param message - Optional custom error message
 * @returns BaseAppError with PAYMENT_FAILED code
 */
export const createCheckoutError = (message = 'Failed to process checkout'): BaseAppError =>
  new BaseAppError(ErrorCode.PAYMENT_FAILED, message, 'Checkout operation failed');

/**
 * Creates error for failed payment processing
 * @param message - Optional custom error message
 * @returns BaseAppError with PAYMENT_FAILED code
 */
export const createPaymentError = (message = 'Payment failed'): BaseAppError =>
  new BaseAppError(ErrorCode.PAYMENT_FAILED, message, 'Payment processing failed');

/**
 * Creates error for order not found scenarios
 * @param message - Optional custom error message
 * @returns BaseAppError with ORDER_NOT_FOUND code
 */
export const createOrderNotFoundError = (message = 'Order not found'): BaseAppError =>
  new BaseAppError(ErrorCode.ORDER_NOT_FOUND, message, 'Order lookup failed');

/**
 * Creates error for failed order cancellation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createOrderCancelError = (message = 'Failed to cancel order'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Order cancellation failed');

/**
 * Creates error for failed order tracking data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createOrderTrackingError = (message = 'Failed to load order tracking'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Order tracking data fetch failed');
