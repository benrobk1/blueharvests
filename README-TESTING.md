# Testing Guide

This project includes comprehensive testing setup with Vitest and Playwright.

## Unit Tests (Vitest)

Run unit tests:
```bash
npm run test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
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
