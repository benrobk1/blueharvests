# Feature-Based Architecture

This directory contains all feature modules organized by business domain. Each feature is a self-contained module with its own components, queries, types, and error handling.

## Structure

```
src/features/{feature}/
  ├── components/       # Feature-specific UI components
  ├── hooks/           # Custom React hooks (optional)
  ├── queries/         # React Query factory (required)
  ├── types/           # TypeScript types (optional)
  ├── errors.ts        # Error type creators (required)
  └── index.ts         # Public API exports (required)
```

## Features

### Admin (`/admin`)
Admin dashboard, user management, and system configuration.
- **Components**: AdminRoleManager, CreditsManager, KPIHeader, TaxDocumentGenerator
- **Queries**: `adminQueries` - Users, roles, analytics, audits
- **Errors**: Role, credits, KPI, approval, tax document errors

### Cart (`/cart`)
Shopping cart functionality with save/load capabilities.
- **Components**: CartDrawer, SaveCartDialog, SavedCartsList
- **Hooks**: `useCart`, `useCartActions`
- **Queries**: `cartQueries` - Cart items, saved carts, totals
- **Errors**: Add, remove, update, save, load cart errors

### Consumers (`/consumers`)
Consumer-specific features like referrals and credits.
- **Queries**: `consumerQueries` - Profile, credits, referrals, subscriptions
- **Errors**: Referral, subscription, credits, rating errors

### Drivers (`/drivers`)
Driver routing, deliveries, and earnings.
- **Components**: AvailableRoutes, BoxCodeScanner, RouteDensityMap
- **Queries**: `driverQueries` - Routes, batches, earnings, payouts
- **Errors**: Route claim, delivery, box scan, payout errors

### Farmers (`/farmers`)
Farm inventory, product management, and batch coordination.
- **Components**: ProductForm, CSVProductImport, BatchConsolidation, MultiFarmDashboard
- **Queries**: `farmerQueries` - Profile, products, batches, payouts
- **Errors**: Product, inventory, CSV import, batch, payout, Stripe errors

### Orders (`/orders`)
Order processing, tracking, and history.
- **Hooks**: `useActiveOrder`
- **Queries**: `orderQueries` - Active orders, history, tracking
- **Errors**: Checkout, payment, not found, cancel, tracking errors

### Payouts (`/payouts`)
Payment processing and payout history.
- **Queries**: `payoutQueries` - History, pending, processed
- **Errors**: Load, process, history errors

### Products (`/products`)
Product catalog, search, and approval.
- **Hooks**: `useShopProducts`, `useProductSearch`
- **Queries**: `productQueries` - Shop data, search, pending approval
- **Errors**: Load, search, approval errors

## Usage Guidelines

### Importing from Features
Always import from the feature barrel export, never from internal files:

```typescript
// ✅ Correct
import { farmerQueries, ProductForm, createProductError } from '@/features/farmers';

// ❌ Wrong
import { ProductForm } from '@/features/farmers/components/ProductForm';
import { farmerQueries } from '@/features/farmers/queries';
```

### Query Factory Pattern
All queries use the factory pattern for consistency:

```typescript
// Using queries in components
const { data: profile } = useQuery(farmerQueries.profile(userId));
const { data: products } = useQuery(farmerQueries.products(farmId));

// Invalidating queries in mutations
queryClient.invalidateQueries({ queryKey: farmerQueries.all });
```

### Error Handling
Use feature-specific error creators with `useErrorHandler`:

```typescript
import { useErrorHandler } from '@/lib/errors/useErrorHandler';
import { createProductError } from '@/features/farmers';

const { handleError } = useErrorHandler();

try {
  await saveProduct(data);
} catch (error) {
  handleError(createProductError('Failed to save product'));
}
```

## Adding New Features

1. **Create feature directory**: `src/features/{feature}/`
2. **Add query factory**: Create `queries/index.ts` with query factory
3. **Add error creators**: Create `errors.ts` with error type creators
4. **Create components**: Add feature-specific components in `components/`
5. **Export public API**: Update `index.ts` to export public interfaces
6. **Document**: Add JSDoc comments to all public exports

## Best Practices

- **Keep features isolated**: Features should not directly import from other features
- **Use shared utilities**: Common logic goes in `src/lib/` or `src/hooks/`
- **Type everything**: Export TypeScript types through feature barrel
- **Handle errors gracefully**: Use error creators for consistent UX
- **Document public APIs**: Add JSDoc comments to exported functions/components
