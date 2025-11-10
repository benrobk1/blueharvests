# Edge Function Monitoring Guide

## Overview

This guide covers monitoring, observability, and debugging for Supabase Edge Functions using the middleware pattern.

## Structured Logging

All edge functions use structured JSON logging for easy parsing and aggregation.

### Log Types

1. **Request Metrics**
```json
{
  "type": "metrics",
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "abc-123-def",
  "functionName": "checkout",
  "method": "POST",
  "path": "/checkout",
  "statusCode": 200,
  "durationMs": 245,
  "userId": "user-456",
  "metadata": {
    "markers": [
      { "name": "auth_complete", "timestamp": 45 },
      { "name": "validation_complete", "timestamp": 78 },
      { "name": "payment_complete", "timestamp": 210 }
    ]
  }
}
```

2. **Business Events**
```json
{
  "type": "business_event",
  "requestId": "abc-123-def",
  "eventType": "order_created",
  "details": {
    "orderId": "order-789",
    "totalAmount": 125.50,
    "deliveryDate": "2025-01-20"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

3. **Security Events**
```json
{
  "type": "security_event",
  "requestId": "abc-123-def",
  "eventType": "rate_limit_exceeded",
  "userId": "user-456",
  "details": {
    "endpoint": "checkout",
    "attemptCount": 12,
    "windowMs": 900000
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

4. **Slow Query Warnings**
```json
{
  "type": "slow_query",
  "requestId": "abc-123-def",
  "query": "SELECT * FROM orders WHERE...",
  "durationMs": 1850,
  "threshold": 1000,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Using Metrics Collector

### Basic Usage

```typescript
import { withMetrics } from '../_shared/middleware/withMetrics.ts';

const handler = withMetrics('my-function')(async (req, ctx) => {
  // Track performance milestones
  ctx.metrics.mark('validation_complete');
  
  // ... business logic ...
  
  ctx.metrics.mark('database_complete');
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Logging Business Events

```typescript
import { logBusinessEvent } from '../_shared/monitoring/metrics.ts';

// Log important business events
logBusinessEvent(ctx.requestId, 'order_created', {
  orderId: order.id,
  totalAmount: order.total_amount,
  deliveryDate: order.delivery_date,
});
```

### Logging Security Events

```typescript
import { logSecurityEvent } from '../_shared/monitoring/metrics.ts';

// Log security-related events
logSecurityEvent(ctx.requestId, 'failed_auth_attempt', userId, {
  reason: 'invalid_token',
  ipAddress: req.headers.get('x-forwarded-for'),
});
```

### Tracking Slow Queries

```typescript
import { logSlowQuery } from '../_shared/monitoring/metrics.ts';

const startTime = Date.now();
const { data, error } = await supabase.from('orders').select('*');
const duration = Date.now() - startTime;

// Automatically warns if query exceeds threshold (default 1000ms)
logSlowQuery(ctx.requestId, 'SELECT * FROM orders', duration);
```

## Performance Markers

Use performance markers to track execution time of key operations:

```typescript
const handler = withMetrics('checkout')(async (req, ctx) => {
  ctx.metrics.mark('start');
  
  // Authentication
  // ... auth logic ...
  ctx.metrics.mark('auth_complete');
  
  // Validation
  // ... validation logic ...
  ctx.metrics.mark('validation_complete');
  
  // Database operations
  // ... db operations ...
  ctx.metrics.mark('database_complete');
  
  // Payment processing
  // ... payment logic ...
  ctx.metrics.mark('payment_complete');
  
  return new Response(/* ... */);
});
```

Markers will appear in the metrics log:
```json
{
  "metadata": {
    "markers": [
      { "name": "start", "timestamp": 0 },
      { "name": "auth_complete", "timestamp": 45 },
      { "name": "validation_complete", "timestamp": 78 },
      { "name": "database_complete", "timestamp": 180 },
      { "name": "payment_complete", "timestamp": 210 }
    ]
  }
}
```

## Monitoring Best Practices

### 1. Request ID Correlation
Always use `requestId` to correlate logs for a single request:

```bash
# Filter logs by request ID
supabase functions logs checkout | grep "abc-123-def"
```

### 2. Track Critical Paths
Add performance markers for:
- Authentication
- Validation
- Database queries
- External API calls
- Payment processing

### 3. Log Business Events
Track important business metrics:
- Orders created/canceled
- Payments processed
- Payouts completed
- Batches generated

### 4. Monitor Security Events
Always log:
- Failed authentication attempts
- Rate limit violations
- Permission denials
- Invalid input attempts

### 5. Set Query Thresholds
Define acceptable query times and monitor violations:

```typescript
// Custom threshold for critical queries
logSlowQuery(ctx.requestId, query, duration, 500); // 500ms threshold
```

## Debugging Common Issues

### High Latency

1. Check performance markers to identify slow operations
2. Review slow query logs
3. Verify rate limiting isn't causing delays
4. Check external API response times

### Authentication Failures

1. Filter logs for `security_event` with `eventType: "failed_auth"`
2. Check JWT token expiration
3. Verify Supabase client configuration

### Rate Limit Exceeded

1. Review `security_event` logs for rate limit violations
2. Adjust rate limit thresholds in `constants.ts` if needed
3. Implement exponential backoff on client side

### Database Performance

1. Monitor slow query warnings
2. Add database indexes for frequently queried fields
3. Optimize query patterns (reduce N+1 queries)

## Alerting Recommendations

Set up alerts for:

1. **High Error Rate** (>5% of requests)
2. **Slow Response Time** (p95 > 2000ms)
3. **Rate Limit Exceeded** (>10 violations/minute)
4. **Authentication Failures** (>20 failures/minute)
5. **Database Slow Queries** (>100 slow queries/hour)

## Integration with External Services

### Sentry Integration

Middleware automatically sends errors to Sentry if configured:

```typescript
// Errors are automatically captured by withErrorHandling middleware
// No additional code needed
```

### Log Aggregation Tools

Structured JSON logs can be easily ingested by:
- **Datadog**: Parse JSON logs and create dashboards
- **Grafana Loki**: Query logs using LogQL
- **CloudWatch**: Stream logs and set up alarms
- **Elasticsearch**: Index logs for full-text search

### Example Datadog Query

```
type:metrics statusCode:>=500 functionName:checkout
```

### Example Loki Query

```logql
{function="checkout"} | json | statusCode >= 500
```

## Performance Targets

### Response Time
- **p50**: < 500ms
- **p95**: < 2000ms
- **p99**: < 5000ms

### Error Rate
- **Overall**: < 1%
- **4xx errors**: < 5%
- **5xx errors**: < 0.5%

### Availability
- **Uptime**: > 99.9%
- **Success Rate**: > 99%

## Related Documentation

- [MIDDLEWARE.md](../supabase/functions/MIDDLEWARE.md) - Middleware pattern reference
- [TESTING-GUIDE.md](./TESTING-GUIDE.md) - Testing strategies
- [RUNBOOK.md](./RUNBOOK.md) - Operations runbook
