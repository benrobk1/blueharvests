/**
 * ERROR HANDLER HOOK
 * Centralized error handling with consistent user feedback
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { captureException } from '@/lib/sentry';
import { BaseAppError, ErrorCode, ERROR_MESSAGES } from './ErrorTypes';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logToSentry?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: unknown,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logToSentry = true,
      fallbackMessage = 'An unexpected error occurred'
    } = options;

    let userMessage = fallbackMessage;
    let errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR;

    // Handle AppError instances
    if (error instanceof BaseAppError) {
      userMessage = error.userMessage;
      errorCode = error.code;
      
      if (logToSentry && error.technicalMessage) {
        captureException(error, {
          tags: { errorCode: error.code },
          extra: error.context,
        });
      }
    }
    // Handle standard Error instances
    else if (error instanceof Error) {
      userMessage = error.message || fallbackMessage;
      
      if (logToSentry) {
        captureException(error);
      }
    }
    // Handle string errors
    else if (typeof error === 'string') {
      userMessage = error;
    }
    // Handle unknown error types
    else {
      console.error('Unknown error type:', error);
      
      if (logToSentry) {
        captureException(new Error('Unknown error type'), {
          extra: { error },
        });
      }
    }

    // Show toast notification
    if (showToast) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: userMessage,
      });
    }

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('[ErrorHandler]', {
        code: errorCode,
        message: userMessage,
        originalError: error,
      });
    }

    return {
      code: errorCode,
      message: userMessage,
    };
  }, [toast]);

  // Specialized error handlers for common scenarios
  const handleAuthError = useCallback((error: unknown) => {
    return handleError(error, {
      fallbackMessage: ERROR_MESSAGES[ErrorCode.AUTH_UNAUTHORIZED],
    });
  }, [handleError]);

  const handleNetworkError = useCallback((error: unknown) => {
    return handleError(error, {
      fallbackMessage: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
    });
  }, [handleError]);

  const handleValidationError = useCallback((error: unknown) => {
    return handleError(error, {
      fallbackMessage: ERROR_MESSAGES[ErrorCode.VALIDATION_ERROR],
      logToSentry: false, // Don't log validation errors to Sentry
    });
  }, [handleError]);

  const handlePaymentError = useCallback((error: unknown) => {
    return handleError(error, {
      fallbackMessage: ERROR_MESSAGES[ErrorCode.PAYMENT_FAILED],
    });
  }, [handleError]);

  return {
    handleError,
    handleAuthError,
    handleNetworkError,
    handleValidationError,
    handlePaymentError,
  };
};
