/**
 * PRODUCT FEATURE ERROR TYPES
 * Feature-specific error creators for product operations
 * 
 * @module features/products/errors
 * @description Type-safe error creators for product-related failures including
 * loading, searching, and approval operations.
 */

import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

/**
 * Creates error for failed product data load
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createProductLoadError = (message = 'Failed to load products'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Product data fetch failed');

/**
 * Creates error for failed product search operation
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createProductSearchError = (message = 'Failed to search products'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Product search operation failed');

/**
 * Creates error for failed product approval
 * @param message - Optional custom error message
 * @returns BaseAppError with SERVER_ERROR code
 */
export const createProductApprovalError = (message = 'Failed to approve product'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Product approval operation failed');
