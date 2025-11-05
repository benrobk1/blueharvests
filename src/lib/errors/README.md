# Error Handling System

Standardized error handling with type-safe error codes, user-friendly messages, and automatic Sentry integration.

## Architecture

```
ErrorTypes.ts          → Define error codes and base error class
useErrorHandler.ts     → React hook for handling errors
ErrorBoundary.tsx      → Catch React component errors
{feature}/errors.ts    → Feature-specific error creators
```

## Error Types

### ErrorCode Enum
Predefined error codes for consistent classification:

```typescript
enum ErrorCode {
  // Authentication
  AUTH_UNAUTHORIZED,
  AUTH_SESSION_EXPIRED,
  AUTH_INVALID_CREDENTIALS,
  
  // Network
  NETWORK_ERROR,
  NETWORK_TIMEOUT,
  
  // Validation
  VALIDATION_ERROR,
  VALIDATION_REQUIRED_FIELD,
  
  // Business Logic
  CART_EMPTY,
  ORDER_NOT_FOUND,
  INSUFFICIENT_INVENTORY,
  PAYMENT_FAILED,
  
  // Generic
  UNKNOWN_ERROR,
  SERVER_ERROR
}
```

### BaseAppError Class
Structured error with user and technical messages:

```typescript
class BaseAppError extends Error {
  code: ErrorCode;
  userMessage: string;      // Shown to user in toast
  technicalMessage?: string; // Logged for developers
  context?: Record<string, unknown>; // Additional debug info
}
```

## Creating Feature Errors

Each feature defines error creators in `errors.ts`:

```typescript
// src/features/farmers/errors.ts
import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const createProductError = (message = 'Failed to save product'): BaseAppError =>
  new BaseAppError(
    ErrorCode.SERVER_ERROR,
    message,                    // User message
    'Product operation failed', // Technical message
    { feature: 'farmers' }      // Context
  );

export const createInventoryError = (message = 'Failed to update inventory'): BaseAppError =>
  new BaseAppError(ErrorCode.SERVER_ERROR, message, 'Inventory update failed');
```

## Using Error Handler

### Basic Usage

```typescript
import { useErrorHandler } from '@/lib/errors/useErrorHandler';
import { createProductError } from '@/features/farmers/errors';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const saveProduct = async () => {
    try {
      await api.saveProduct();
    } catch (error) {
      handleError(createProductError('Product name already exists'));
    }
  };
}
```

### Specialized Handlers

```typescript
const {
  handleError,           // General error handler
  handleAuthError,       // Authentication errors
  handleNetworkError,    // Network/connectivity errors
  handleValidationError, // Form validation errors (no Sentry)
  handlePaymentError     // Payment processing errors
} = useErrorHandler();

// Examples
handleAuthError(error); // Shows "You need to be logged in..."
handleNetworkError(error); // Shows "Unable to connect..."
handleValidationError(error); // Shows error without Sentry logging
```

### Custom Options

```typescript
handleError(error, {
  showToast: true,              // Show toast notification (default: true)
  logToSentry: true,            // Log to Sentry (default: true)
  fallbackMessage: 'Oops!'      // Fallback if error message missing
});
```

## Error Boundary

Catches errors in React component tree:

```typescript
import { ErrorBoundary } from '@/lib/errors/ErrorBoundary';

// Wrap your app or routes
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Custom fallback UI
<ErrorBoundary fallback={<CustomError />}>
  <RiskyComponent />
</ErrorBoundary>

// HOC wrapper
const SafeComponent = withErrorBoundary(RiskyComponent);
```

## Features

### Automatic Toast Notifications
All errors automatically show user-friendly toast notifications:
- ✅ Consistent styling (destructive variant)
- ✅ Title + description
- ✅ Auto-dismiss

### Sentry Integration
Errors automatically logged to Sentry with:
- Error code tags
- User context
- Stack traces (dev mode only)
- Request context
- Can be disabled per error type

### Development Logging
Detailed console logging in development:
```
[ErrorHandler] {
  code: 'PRODUCT_ERROR',
  message: 'Failed to save product',
  originalError: Error {...}
}
```

## Best Practices

### ✅ DO
- Use feature-specific error creators
- Provide helpful user messages
- Include context for debugging
- Handle errors at the right level
- Use specialized handlers (auth, network, etc.)

### ❌ DON'T
- Use generic `new Error()` in components
- Show technical errors to users
- Ignore caught errors
- Log validation errors to Sentry
- Expose stack traces in production

## Migration Guide

### Old Pattern
```typescript
// ❌ Before
toast({
  variant: 'destructive',
  title: 'Error',
  description: error.message
});
console.error(error);
```

### New Pattern
```typescript
// ✅ After
import { useErrorHandler } from '@/lib/errors/useErrorHandler';
import { createProductError } from '@/features/farmers/errors';

const { handleError } = useErrorHandler();

handleError(createProductError('Failed to save product'));
```

## Error Creator Template

```typescript
// src/features/{feature}/errors.ts
import { BaseAppError, ErrorCode } from '@/lib/errors/ErrorTypes';

export const create{Feature}Error = (
  message = 'Default user message'
): BaseAppError =>
  new BaseAppError(
    ErrorCode.SERVER_ERROR,    // Or specific error code
    message,                    // User-facing message
    'Technical description',    // Developer message
    { feature: '{feature}' }    // Debug context (optional)
  );
```
