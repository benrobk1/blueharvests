# Edge Functions Middleware Pattern

## Overview

This project uses a **curried middleware pattern** for all Supabase Edge Functions. Middleware functions wrap your business logic handlers to provide cross-cutting concerns like authentication, validation, rate limiting, and error handling.

## Architecture

### Middleware Signature

```typescript
type Middleware<T = any> = (
  handler: (req: Request, ctx: T) => Promise<Response>
) => (req: Request, ctx: T) => Promise<Response>;
```

Each middleware is a higher-order function that:
1. Takes a handler function as input
2. Returns a new handler function with added functionality
3. Can access and modify the context object

### Execution Flow

Middleware executes in layers from outermost to innermost:

```
Request → Error Handling → Request ID → CORS → Auth → Rate Limit → Validation → Business Logic
```

## Available Middleware

### 1. `withErrorHandling`

Catches all unhandled errors and returns structured error responses.

```typescript
import { withErrorHandling } from '../_shared/middleware/index.ts';

const handler = withErrorHandling(async (req, ctx) => {
  // Your logic here
  return new Response('OK');
});
```

**Context Requirements:** None (base middleware)

**What it provides:**
- Global error catching
- Structured error responses
- Error logging with request ID
- Sentry integration (if configured)

---

### 2. `withRequestId`

Generates unique request IDs for correlated logging.

```typescript
import { withRequestId } from '../_shared/middleware/index.ts';

const handler = withRequestId(async (req, ctx) => {
  console.log(`[${ctx.requestId}] Processing request`);
  return new Response('OK');
});
```

**Context Requirements:** None

**What it provides:**
- `ctx.requestId: string` - Unique UUID for this request
- Automatic request start/complete logging
- Request duration tracking

---

### 3. `withCORS`

Handles CORS headers and OPTIONS requests.

```typescript
import { withCORS } from '../_shared/middleware/index.ts';

const handler = withCORS(async (req, ctx) => {
  // CORS already handled
  return new Response('OK');
});
```

**Context Requirements:** None

**What it provides:**
- `ctx.corsHeaders: Record<string, string>` - Standard CORS headers
- Automatic OPTIONS request handling
- CORS headers attached to all responses

---

### 4. `withAuth`

Validates JWT tokens and attaches authenticated user to context.

```typescript
import { withAuth } from '../_shared/middleware/index.ts';

const handler = withAuth(async (req, ctx) => {
  console.log('Authenticated user:', ctx.user.id);
  return new Response('OK');
});
```

**Context Requirements:**
- `ctx.supabase: SupabaseClient` (must be initialized before withAuth)
- `ctx.config: EdgeFunctionConfig` (optional)

**What it provides:**
- `ctx.user: User` - Authenticated Supabase user object
- Returns 401 if token is missing or invalid

---

### 5. `withAdminAuth`

Validates user has admin role.

```typescript
import { withAdminAuth } from '../_shared/middleware/index.ts';

const handler = withAdminAuth(async (req, ctx) => {
  // User is verified admin
  return new Response('OK');
});
```

**Context Requirements:**
- `ctx.user: User` (from withAuth)
- `ctx.supabase: SupabaseClient`

**What it provides:**
- Admin role verification via `has_role` RPC
- Returns 403 if user is not an admin

**Important:** Must be used AFTER `withAuth`

---

### 6. `withDriverAuth`

Validates user has driver role.

```typescript
import { withDriverAuth } from '../_shared/middleware/index.ts';

const handler = withDriverAuth(async (req, ctx) => {
  // User is verified driver
  return new Response('OK');
});
```

**Context Requirements:**
- `ctx.user: User` (from withAuth)
- `ctx.supabase: SupabaseClient`

**What it provides:**
- Driver role verification via `has_role` RPC
- Returns 403 if user is not a driver

**Important:** Must be used AFTER `withAuth`

---

### 7. `withRateLimit`

Applies rate limiting per user.

```typescript
import { withRateLimit } from '../_shared/middleware/index.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';

const handler = withRateLimit(RATE_LIMITS.CHECKOUT)(async (req, ctx) => {
  return new Response('OK');
});
```

**Context Requirements:**
- `ctx.user: User` (typically from withAuth)
- `ctx.supabase: SupabaseClient`

**What it provides:**
- Per-user rate limiting
- Returns 429 if limit exceeded
- `Retry-After` header in response

**Configuration:**
```typescript
interface RateLimitConfig {
  keyPrefix: string;      // e.g., 'checkout'
  maxRequests: number;    // e.g., 10
  windowMs: number;       // e.g., 60000 (1 minute)
}
```

---

### 8. `withValidation`

Validates request body against Zod schema.

```typescript
import { withValidation } from '../_shared/middleware/index.ts';
import { z } from 'zod';

const RequestSchema = z.object({
  amount: z.number().positive(),
  description: z.string(),
});

const handler = withValidation(RequestSchema)(async (req, ctx) => {
  // ctx.validatedData contains parsed & validated data
  const { amount, description } = ctx.validatedData;
  return new Response('OK');
});
```

**Context Requirements:** None

**What it provides:**
- `ctx.validatedData: T` - Parsed and validated request body
- Returns 400 if validation fails
- Type-safe validated data

---

## Composing Middleware

### Using `composeMiddleware`

Compose multiple middleware functions together:

```typescript
import { 
  composeMiddleware,
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit,
} from '../_shared/middleware/index.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';

const middleware = composeMiddleware([
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit(RATE_LIMITS.CHECKOUT),
]);

serve(middleware(async (req, ctx) => {
  // All middleware applied
  return new Response('OK');
}));
```

### Using `createMiddlewareStack`

More explicit alternative with first-to-last execution order:

```typescript
import { createMiddlewareStack } from '../_shared/middleware/index.ts';

const stack = createMiddlewareStack([
  withErrorHandling,  // Runs first (wraps everything)
  withRequestId,      // Runs second
  withCORS,          // Runs third
  withAuth,          // Runs fourth
]);
```

---

## Common Patterns

### Pattern 1: Public Endpoint (No Auth)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  composeMiddleware,
  withErrorHandling,
  withRequestId,
  withCORS,
} from '../_shared/middleware/index.ts';

const middleware = composeMiddleware([
  withErrorHandling,
  withRequestId,
  withCORS,
]);

serve(middleware(async (req, ctx) => {
  return new Response('Public endpoint');
}));
```

### Pattern 2: Authenticated User Endpoint

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from '../_shared/config.ts';
import { 
  composeMiddleware,
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit,
  withValidation,
} from '../_shared/middleware/index.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { z } from 'zod';

const RequestSchema = z.object({
  data: z.string(),
});

const middleware = composeMiddleware([
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit(RATE_LIMITS.DEFAULT),
  withValidation(RequestSchema),
]);

serve(middleware(async (req, ctx) => {
  const { user, validatedData } = ctx;
  // Process authenticated user request
  return new Response('OK');
}));
```

### Pattern 3: Admin-Only Endpoint

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from '../_shared/config.ts';
import { 
  composeMiddleware,
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withAdminAuth,
  withRateLimit,
} from '../_shared/middleware/index.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';

const middleware = composeMiddleware([
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withAdminAuth,
  withRateLimit(RATE_LIMITS.ADMIN),
]);

serve(middleware(async (req, ctx) => {
  const { user } = ctx;
  // Admin-verified user logic
  return new Response('Admin endpoint');
}));
```

### Pattern 4: Driver-Only Endpoint

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from '../_shared/config.ts';
import { 
  composeMiddleware,
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withDriverAuth,
} from '../_shared/middleware/index.ts';

const middleware = composeMiddleware([
  withErrorHandling,
  withRequestId,
  withCORS,
  withAuth,
  withDriverAuth,
]);

serve(middleware(async (req, ctx) => {
  const { user } = ctx;
  // Driver-verified user logic
  return new Response('Driver endpoint');
}));
```

---

## Context Types

Each middleware adds specific fields to the context object:

```typescript
type FullContext = {
  // From withRequestId
  requestId: string;
  
  // From withCORS
  corsHeaders: Record<string, string>;
  
  // From withAuth
  user: User;
  supabase: SupabaseClient;
  config: EdgeFunctionConfig;
  
  // From withValidation
  validatedData: T; // Type depends on schema
};
```

---

## Migration Guide

See [MIDDLEWARE_MIGRATION_GUIDE.md](./MIDDLEWARE_MIGRATION_GUIDE.md) for detailed step-by-step instructions on migrating existing edge functions to this pattern.

---

## Best Practices

1. **Always use `withErrorHandling` as the outermost middleware** - It catches all errors from inner layers

2. **Initialize Supabase client before `withAuth`** - The auth middleware requires a Supabase client in context

3. **Apply rate limiting after authentication** - Prevents authenticated users from being rate limited by public traffic

4. **Use validation for all user inputs** - Define Zod schemas and use `withValidation`

5. **Leverage context types** - TypeScript will ensure you have required context fields

6. **Log with request IDs** - Use `ctx.requestId` in all log statements for correlation

7. **Keep business logic separate** - Move complex logic to service classes

8. **Test middleware independently** - Write unit tests for each middleware layer

---

## Testing

### Testing Individual Middleware

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { withRequestId } from '../_shared/middleware/withRequestId.ts';

Deno.test("withRequestId adds requestId to context", async () => {
  const handler = withRequestId(async (req, ctx) => {
    assertEquals(typeof ctx.requestId, 'string');
    return new Response('OK');
  });
  
  const req = new Request('http://localhost');
  await handler(req, {});
});
```

### Testing Business Logic Without Middleware

```typescript
// Export your business logic separately
export async function processCheckout(data: CheckoutData) {
  // Pure business logic
  return result;
}

// Test it directly
Deno.test("processCheckout calculates total correctly", async () => {
  const result = await processCheckout({ items: [...] });
  assertEquals(result.total, 100);
});
```

### Integration Testing

```typescript
Deno.test("POST /checkout with valid data", async () => {
  const res = await fetch('http://localhost:54321/functions/v1/checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: [...] }),
  });
  
  assertEquals(res.status, 200);
});
```

---

## Troubleshooting

### "Supabase client must be initialized before withAuth"

**Cause:** You're using `withAuth` but haven't added the Supabase client to context.

**Solution:** Initialize the client before composing middleware:

```typescript
const config = loadConfig();
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Add to initial context
serve(middleware(async (req, ctx) => {
  return handler(req, { ...ctx, supabase, config });
}));
```

### "Context type errors"

**Cause:** TypeScript doesn't know what fields are available in context.

**Solution:** Import and use the proper context types:

```typescript
import type { AuthContext } from '../_shared/middleware/index.ts';

const handler = async (req: Request, ctx: AuthContext) => {
  // ctx.user is now typed
};
```

### "Rate limit always triggers"

**Cause:** Rate limit config might be too restrictive or key prefix is shared.

**Solution:** Check your rate limit configuration and ensure unique key prefixes:

```typescript
const RATE_LIMITS = {
  CHECKOUT: {
    keyPrefix: 'checkout',  // Unique prefix
    maxRequests: 10,
    windowMs: 60000,
  }
};
```

---

## Related Files

- **Middleware implementations:** `supabase/functions/_shared/middleware/`
- **Middleware exports:** `supabase/functions/_shared/middleware/index.ts`
- **Migration guide:** `supabase/functions/MIDDLEWARE_MIGRATION_GUIDE.md`
- **Rate limit configs:** `supabase/functions/_shared/constants.ts`
- **Example implementation:** `supabase/functions/award-credits/index.ts`
