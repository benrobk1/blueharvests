# Edge Function Middleware Migration Guide

This guide explains how to refactor edge functions to use the middleware pattern demonstrated in `checkout/index.ts`.

## Table of Contents
- [Before and After Comparison](#before-and-after-comparison)
- [Benefits of Middleware Pattern](#benefits-of-middleware-pattern)
- [Step-by-Step Migration](#step-by-step-migration)
- [Middleware Layers](#middleware-layers)
- [Common Patterns](#common-patterns)
- [Testing](#testing)

---

## Before and After Comparison

### Before (Anti-pattern - see old versions)
```typescript
serve(async (req) => {
  try {
    const body = await req.json();
    // 50+ lines of auth, validation, rate limiting mixed with business logic
    const user = await getUser();
    if (!user) return errorResponse();
    
    const valid = validateInput(body);
    if (!valid) return errorResponse();
    
    // Business logic buried in middleware code
    const result = await doSomething();
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
});
```

### After (Middleware Pattern - see checkout/index.ts)
```typescript
serve(async (req) => {
  // 1. Request ID for correlated logging
  const requestId = crypto.randomUUID();
  
  try {
    // 2. Config loading
    const config = loadConfig();
    const supabase = createClient(/* ... */);
    
    // 3. Auth middleware
    const { user } = await authenticateRequest(req, supabase);
    
    // 4. Rate limiting
    await checkRateLimit(supabase, user.id, rateConfig);
    
    // 5. Input validation
    const input = validateRequest(body, schema);
    
    // 6. Business logic (clean and focused!)
    const result = await service.processRequest(input);
    
    return successResponse(result);
  } catch (error) {
    return handleError(error, requestId);
  }
});
```

---

## Benefits of Middleware Pattern

### 1. **DRY (Don't Repeat Yourself)**
- Auth logic written once in `_shared/middleware/`
- Reused across all edge functions
- Changes propagate automatically

### 2. **Testability**
- Each middleware layer is independently testable
- Business logic tested without auth/validation concerns
- Mock middleware for unit tests

### 3. **Maintainability**
- Clear separation of concerns
- Easy to add/remove middleware layers
- Obvious execution order

### 4. **Type Safety**
- TypeScript context types flow through middleware
- Compile-time guarantees about available data
- IDE autocomplete for context properties

### 5. **Observability**
- Request IDs for correlated logging
- Consistent log format across functions
- Easy to trace request lifecycle

---

## Step-by-Step Migration

### Step 1: Add Request ID Generation

**Purpose:** Correlate all logs for a single request

```typescript
serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [FUNCTION_NAME] Request started`);
  
  try {
    // ... rest of function
    console.log(`[${requestId}] Processing step X`);
  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
  }
});
```

**Benefits:**
- Trace request flow through logs
- Debug production issues
- Monitor performance

---

### Step 2: Extract Authentication

**Purpose:** Validate JWT and get authenticated user

```typescript
// Auth middleware layer
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ 
    error: 'UNAUTHORIZED',
    message: 'Missing authorization header'
  }), {
    status: 401,
    headers: corsHeaders,
  });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  console.error(`[${requestId}] Auth failed:`, error?.message);
  return new Response(JSON.stringify({ 
    error: 'UNAUTHORIZED',
    message: 'Invalid or expired token'
  }), {
    status: 401,
    headers: corsHeaders,
  });
}

console.log(`[${requestId}] Authenticated user: ${user.id}`);
```

**When to use:**
- Functions that require user authentication
- Functions accessing user-specific data
- Functions modifying user resources

**When to skip:**
- Public endpoints (webhooks, health checks)
- System-level cron jobs

---

### Step 3: Add Rate Limiting

**Purpose:** Prevent abuse and protect resources

```typescript
import { checkRateLimit } from '../_shared/rateLimiter.ts';

const rateCheck = await checkRateLimit(supabase, user.id, {
  maxRequests: 10,          // Max requests
  windowMs: 15 * 60 * 1000, // Per 15 minutes
  keyPrefix: 'function-name', // Unique per function
});

if (!rateCheck.allowed) {
  console.warn(`[${requestId}] Rate limit exceeded for user ${user.id}`);
  return new Response(
    JSON.stringify({ 
      error: 'TOO_MANY_REQUESTS', 
      message: 'Too many requests. Please try again later.',
      retryAfter: rateCheck.retryAfter 
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders,
        'Retry-After': String(rateCheck.retryAfter || 60),
      } 
    }
  );
}
```

**Rate Limit Configuration:**
- **High-cost operations** (checkout, payouts): 10 requests / 15 min
- **Medium operations** (batch generation): 20 requests / 15 min
- **Read operations** (queries): 100 requests / 15 min

---

### Step 4: Add Input Validation

**Purpose:** Validate request body against schema

```typescript
import { YourRequestSchema } from '../_shared/contracts/yourFunction.ts';

const body = await req.json();
const validationResult = YourRequestSchema.safeParse(body);

if (!validationResult.success) {
  console.warn(`[${requestId}] Validation failed:`, validationResult.error.flatten());
  return new Response(JSON.stringify({
    error: 'VALIDATION_ERROR',
    message: 'Invalid request format',
    details: validationResult.error.flatten()
  }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const input = validationResult.data;
// input is now type-safe and validated!
```

**Schema Location:** `supabase/functions/_shared/contracts/`

**Example Schema:**
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const YourRequestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
  field3: z.boolean().default(false),
});

export type YourRequest = z.infer<typeof YourRequestSchema>;
```

---

### Step 5: Extract Business Logic to Service

**Purpose:** Separate domain logic from HTTP concerns

```typescript
// _shared/services/YourService.ts
export class YourServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'YourServiceError';
  }
}

export class YourService {
  constructor(
    private supabase: SupabaseClient,
    private config: EdgeFunctionConfig
  ) {}

  async processRequest(input: YourRequest): Promise<YourResponse> {
    // Pure business logic here
    // Throw YourServiceError for domain errors
  }
}
```

**In edge function:**
```typescript
const service = new YourService(supabase, config);

try {
  const result = await service.processRequest(input);
  return successResponse(result);
} catch (error) {
  if (error instanceof YourServiceError) {
    return new Response(JSON.stringify({
      error: error.code,
      message: error.message,
      details: error.details
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  throw error; // Re-throw for global error handler
}
```

---

### Step 6: Structured Error Handling

**Purpose:** Return appropriate error codes and messages

```typescript
try {
  // Middleware and business logic
} catch (error: any) {
  // Domain-specific errors (4xx)
  if (error instanceof CheckoutError) {
    console.error(`[${requestId}] ❌ ${error.code}: ${error.message}`);
    return new Response(JSON.stringify({
      error: error.code,
      message: error.message,
      details: error.details
    }), {
      status: 400,
      headers: corsHeaders
    });
  }
  
  // Unexpected errors (5xx)
  console.error(`[${requestId}] ❌ Unhandled error:`, error);
  return new Response(JSON.stringify({ 
    error: 'INTERNAL_ERROR',
    message: error.message 
  }), {
    status: 500,
    headers: corsHeaders
  });
}
```

**Error Codes:**
- `UNAUTHORIZED` (401) - Missing/invalid auth
- `FORBIDDEN` (403) - Insufficient permissions
- `VALIDATION_ERROR` (400) - Invalid input
- `TOO_MANY_REQUESTS` (429) - Rate limit exceeded
- `DOMAIN_SPECIFIC_ERROR` (400) - Business logic errors
- `INTERNAL_ERROR` (500) - Unexpected errors

---

### Step 7: Consistent Logging

**Purpose:** Standardized logs for debugging and monitoring

```typescript
// Format: [requestId] [FUNCTION_NAME] Status: Message

// Request start
console.log(`[${requestId}] [CHECKOUT] Request started: ${req.method} ${req.url}`);

// Progress
console.log(`[${requestId}] Authenticated user: ${user.id}`);
console.log(`[${requestId}] Processing cart ${cartId}`);

// Success (use ✅)
console.log(`[${requestId}] ✅ Success: order ${orderId} created`);

// Errors (use ❌)
console.error(`[${requestId}] ❌ Error [CODE]: message`);

// Warnings (use ⚠️)
console.warn(`[${requestId}] ⚠️ Rate limit exceeded for user ${userId}`);
```

---

## Middleware Layers

### Layer 1: Error Handling (Outermost)
- Catches all unhandled errors
- Returns 500 with error message
- Logs stack traces

### Layer 2: Request ID
- Generates UUID for request
- Adds to context
- Used in all logs

### Layer 3: CORS
- Validates origin
- Returns CORS headers
- Handles OPTIONS preflight

### Layer 4: Authentication
- Validates JWT token
- Extracts user
- Returns 401 if invalid

### Layer 5: Rate Limiting
- Checks request count
- Returns 429 if exceeded
- Configurable per function

### Layer 6: Validation
- Parses request body
- Validates against schema
- Returns 400 if invalid

### Layer 7: Business Logic (Innermost)
- Pure domain logic
- Uses validated input
- Returns success/domain errors

---

## Common Patterns

### Pattern 1: Authenticated User-Facing Endpoint
```typescript
// Auth + Rate Limit + Validation
serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const config = loadConfig();
    const supabase = createClient(/* service role */);
    
    const { user } = await authenticate(req, supabase);
    await rateLimit(supabase, user.id, { max: 10, window: 15min });
    const input = validate(body, schema);
    
    const result = await service.process(input);
    return success(result);
  } catch (error) {
    return handleError(error, requestId);
  }
});
```

### Pattern 2: Public Webhook
```typescript
// No auth, just validation and rate limiting by IP
serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const ip = req.headers.get('x-forwarded-for');
    await rateLimit(supabase, ip, { max: 100, window: 1min });
    
    const input = validate(body, schema);
    const result = await service.process(input);
    return success(result);
  } catch (error) {
    return handleError(error, requestId);
  }
});
```

### Pattern 3: Admin-Only Endpoint
```typescript
// Auth + Admin check
serve(async (req) => {
  const requestId = crypto.randomUUID();
  try {
    const { user } = await authenticate(req, supabase);
    
    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
      
    if (!roles?.some(r => r.role === 'admin')) {
      return forbidden('Admin access required');
    }
    
    const result = await service.adminAction(input);
    return success(result);
  } catch (error) {
    return handleError(error, requestId);
  }
});
```

---

## Testing

### Unit Test Middleware
```typescript
// Test auth middleware
Deno.test('withAuth - returns 401 for missing header', async () => {
  const req = new Request('https://example.com', { method: 'POST' });
  const response = await withAuth(mockHandler)(req, {});
  assertEquals(response.status, 401);
});
```

### Test Business Logic Without Middleware
```typescript
// Mock authenticated context
Deno.test('CheckoutService - processes valid request', async () => {
  const service = new CheckoutService(mockSupabase, mockStripe);
  const result = await service.processCheckout(validInput);
  assertEquals(result.success, true);
});
```

### Integration Test Full Stack
```typescript
// Test full edge function
Deno.test('checkout - complete flow', async () => {
  const req = new Request('https://example.com/checkout', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid-token' },
    body: JSON.stringify(validRequest)
  });
  
  const response = await handler(req);
  assertEquals(response.status, 200);
});
```

---

## Next Steps

1. ✅ Review `checkout/index.ts` as reference implementation
2. ✅ Compare with `generate-batches/index.ts` (before refactoring)
3. ✅ Pick one simple function to refactor first
4. ✅ Test thoroughly before and after
5. ✅ Gradually migrate other functions
6. ✅ Document any new patterns you discover

---

## Questions?

See `_shared/middleware/` for middleware implementations.
See `_shared/services/` for service layer patterns.
See `_shared/contracts/` for validation schemas.
