/**
 * ERROR TYPES
 * Standardized error types and codes across the application
 */

export enum ErrorCode {
  // Authentication errors
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  
  // Business logic errors
  CART_EMPTY = 'CART_EMPTY',
  CART_ITEM_UNAVAILABLE = 'CART_ITEM_UNAVAILABLE',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  MINIMUM_ORDER_NOT_MET = 'MINIMUM_ORDER_NOT_MET',
  
  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DECLINED = 'PAYMENT_DECLINED',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;
}

export class BaseAppError extends Error implements AppError {
  code: ErrorCode;
  userMessage: string;
  technicalMessage?: string;
  context?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    userMessage: string,
    technicalMessage?: string,
    context?: Record<string, unknown>
  ) {
    super(technicalMessage || userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.context = context;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseAppError);
    }
  }
}

// Predefined error creators for common scenarios
export const createAuthError = (message = 'Authentication failed'): BaseAppError => 
  new BaseAppError(ErrorCode.AUTH_UNAUTHORIZED, message, 'User authentication failed');

export const createNetworkError = (message = 'Network error occurred'): BaseAppError =>
  new BaseAppError(ErrorCode.NETWORK_ERROR, message, 'Failed to connect to server');

export const createValidationError = (message: string, context?: Record<string, unknown>): BaseAppError =>
  new BaseAppError(ErrorCode.VALIDATION_ERROR, message, 'Validation failed', context);

export const createCartError = (message: string): BaseAppError =>
  new BaseAppError(ErrorCode.CART_ITEM_UNAVAILABLE, message, 'Cart operation failed');

export const createPaymentError = (message = 'Payment failed'): BaseAppError =>
  new BaseAppError(ErrorCode.PAYMENT_FAILED, message, 'Payment processing failed');

export const createServerError = (message = 'Server error occurred'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Internal server error');

// Error message mapping
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_UNAUTHORIZED]: 'You need to be logged in to perform this action',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please log in again',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.NETWORK_ERROR]: 'Unable to connect. Please check your internet connection',
  [ErrorCode.NETWORK_TIMEOUT]: 'Request timed out. Please try again',
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Please fill in all required fields',
  [ErrorCode.CART_EMPTY]: 'Your cart is empty',
  [ErrorCode.CART_ITEM_UNAVAILABLE]: 'This item is no longer available',
  [ErrorCode.ORDER_NOT_FOUND]: 'Order not found',
  [ErrorCode.INSUFFICIENT_INVENTORY]: 'Insufficient inventory for this item',
  [ErrorCode.MINIMUM_ORDER_NOT_MET]: 'Minimum order amount not met',
  [ErrorCode.PAYMENT_FAILED]: 'Payment failed. Please try again',
  [ErrorCode.PAYMENT_DECLINED]: 'Payment was declined. Please use a different payment method',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
  [ErrorCode.SERVER_ERROR]: 'Server error. Please try again later',
};
