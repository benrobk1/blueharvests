# Testing Guide

This project includes comprehensive testing setup with Vitest for unit tests, Playwright for E2E tests, and code coverage reporting.

## 📊 Code Coverage

### Running Coverage Reports

Generate coverage report:
```bash
npm run test:coverage
```

View coverage in your browser:
```bash
npm run test:coverage
# Open coverage/index.html in your browser
```

Interactive coverage with UI:
```bash
npm run test:coverage:ui
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Coverage Configuration

Coverage is configured in `vitest.config.ts`:

**Excluded from coverage:**
- Auto-generated files (`src/integrations/supabase/types.ts`)
- Test files and configuration
- UI component library (tested via integration tests)
- Type definitions
- Build artifacts

**Included in coverage:**
- All source files in `src/**/*.{ts,tsx}`
- Feature modules
- Business logic utilities
- Custom hooks
- Services and helpers

### Reading Coverage Reports

**Terminal Output:**
```
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------------|---------|----------|---------|---------|-------------------
src/lib/formatMoney.ts  |   100   |   100    |   100   |   100   |
src/lib/creditsHelpers  |   95.5  |   90     |   100   |   95.5  | 23-25
```

**HTML Report:**
- Open `coverage/index.html` in browser
- Navigate through files to see line-by-line coverage
- Red lines = uncovered code
- Green lines = covered code
- Yellow lines = partially covered branches

### Improving Coverage

**Identify untested code:**
```bash
npm run test:coverage
# Review HTML report at coverage/index.html
```

**Add tests for critical paths:**
1. Business logic in `src/lib/`
2. Feature hooks in `src/features/*/hooks/`
3. Custom React hooks in `src/hooks/`
4. Service classes in backend

**Example: Adding a test for uncovered code**
```typescript
// Found uncovered function in coverage report
describe('calculateDeliveryFee', () => {
  it('returns correct fee for standard delivery', () => {
    expect(calculateDeliveryFee('10001', mockConfig)).toBe(7.50);
  });
  
  it('handles invalid ZIP codes', () => {
    expect(() => calculateDeliveryFee('', mockConfig)).toThrow();
  });
});
```

## Test Coverage

### Unit Tests Coverage Status

#### Business Logic (High Coverage Priority)
- ✅ Money formatting (`src/lib/__tests__/formatMoney.test.ts`)
- ✅ Credits system (`src/lib/__tests__/creditsHelpers.test.ts`)
- ✅ Delivery fees & revenue split (`src/lib/__tests__/deliveryFeeHelpers.test.ts`)
- ✅ Driver expense estimation (`src/lib/__tests__/driverEarningsHelpers.test.ts`)

#### Feature Modules (To Add)
- ⏳ Cart operations (`src/features/cart/`)
- ⏳ Order management (`src/features/orders/`)
- ⏳ Product queries (`src/features/products/`)
- ⏳ Payout calculations (`src/features/payouts/`)

#### Utilities (To Add)
- ⏳ Address helpers (`src/lib/addressHelpers.ts`)
- ⏳ Distance calculations (`src/lib/distanceHelpers.ts`)
- ⏳ Rating helpers (`src/lib/ratingHelpers.ts`)

### E2E Tests Coverage
- ✅ Consumer checkout flow (`e2e/checkout-flow.spec.ts`)
- ✅ Role-based access control (`e2e/auth-roles.spec.ts`)
- ✅ Order cutoff enforcement (`e2e/order-cutoff.spec.ts`)
- ✅ Driver workflow (`e2e/driver-workflow.spec.ts`)

**Current Status:** Unit tests cover critical business logic. Coverage reports help identify gaps for future test additions.

---

## Unit Tests (Vitest)

Run unit tests:
```bash
npm run test
# or
npx vitest
```

Run tests with UI:
```bash
npm run test:ui
# or
npx vitest --ui
```

Run tests with coverage:
```bash
npm run test:coverage
# or
npx vitest --coverage
```

### Writing Unit Tests

Unit tests are located in `src/**/__tests__/` directories. Example:

```typescript
import { describe, it, expect } from 'vitest';
import { formatMoney } from '../formatMoney';

describe('formatMoney', () => {
  it('formats amounts correctly', () => {
    expect(formatMoney(100)).toBe('$100.00');
  });
});
```

## E2E Tests (Playwright)

Run e2e tests:
```bash
npx playwright test
```

Run tests in UI mode:
```bash
npx playwright test --ui
```

Run tests on specific browser:
```bash
npx playwright test --project=chromium
npx playwright test --project=mobile
```

### Writing E2E Tests

E2E tests are located in `e2e/` directory. Example:

```typescript
import { test, expect } from '@playwright/test';

test('user can checkout', async ({ page }) => {
  await page.goto('/consumer/shop');
  await page.getByRole('button', { name: /add to cart/i }).first().click();
  await expect(page.getByText(/1/)).toBeVisible();
});
```

## Error Tracking (Sentry)

Sentry is configured for error tracking in production. To enable:

1. Add your Sentry DSN to `.env`:
```
VITE_SENTRY_DSN=your_sentry_dsn_here
```

2. For source maps upload (optional):
```
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_auth_token
```

## Load Testing

The load test validates batch generation performance by creating real test orders in the database.

### Setup

1. Add your service role key to `.env`:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Security Note:** The service role key bypasses RLS and should only be used in local development. Never commit it to version control.

### Run Load Test

```bash
node scripts/loadtest-batches.js
```

Or if you've added npm scripts:
```bash
npm run test:load
```

### What It Tests

The load test:
1. ✅ Creates 40 test orders with real NYC addresses
2. ✅ Calls the `generate-batches` edge function
3. ✅ Measures performance and validates results
4. ✅ Automatically cleans up all test data

**Expected Performance:**
- ✅ 40 addresses batched in < 3 seconds
- 📦 4 batches created (10 orders per batch)
- 🎯 ~50ms per address average
- 🚀 Extrapolated capacity: ~1,300 orders/hour

**Example Output:**
```
🚀 Starting batch generation load test...

📊 Phase 1: Seeding test data...
✅ Created test consumer: abc-123-def
✅ Created 40 test orders

📦 Phase 2: Running batch generation...

✅ LOAD TEST RESULTS:
─────────────────────────────────────
⏱️  Duration: 1847ms (1.85s)
📦 Batches created: 4
🚚 Orders per batch: 10
🎯 Avg time per address: 46ms
─────────────────────────────────────
🎉 Performance Target: PASSED (< 3s)
✨ System can handle 40+ concurrent orders efficiently

📊 Extrapolated Capacity:
   - 21.7 orders/second
   - ~1,299 orders/minute
   - ~77,940 orders/hour

📍 Batch Details:
   - Batch 1: 10 stops
   - Batch 2: 10 stops
   - Batch 3: 10 stops
   - Batch 4: 10 stops

🧹 Cleaning up test data...
✅ Cleanup complete
```

Performance validated for high-volume order processing.

---

## Performance Indexes

Database indexes have been added for high-traffic queries:
- Orders by consumer and date
- Products by farm and availability
- Delivery batches by driver and status
- Cart items by cart ID
- Payouts by recipient and status

These indexes significantly improve query performance for:
- User dashboards
- Order tracking
- Delivery route optimization
- Financial reporting
