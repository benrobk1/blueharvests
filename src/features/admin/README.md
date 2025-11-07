# Admin Feature

Centralized module for administrative functionality including user management, credits, tax documents, and system monitoring.

## Structure

```
admin/
├── components/        # UI components
│   ├── AdminRoleManager.tsx
│   ├── CreditsManager.tsx
│   ├── FarmAffiliationManager.tsx
│   ├── KPIHeader.tsx
│   ├── TaxDocumentGenerator.tsx
│   └── UserRatingDisplay.tsx
├── queries/          # React Query hooks
│   └── index.ts
├── errors.ts         # Feature-specific errors
└── index.ts          # Public exports
```

## Components

### AdminRoleManager
Manage admin role assignments and permissions.

**Props:**
- None (fetches data internally)

**Usage:**
```tsx
import { AdminRoleManager } from '@/features/admin';

<AdminRoleManager />
```

### CreditsManager
Award credits to consumers for promotions, referrals, or bonuses.

**Props:**
- None (standalone form)

**Usage:**
```tsx
import { CreditsManager } from '@/features/admin';

<CreditsManager />
```

### FarmAffiliationManager
Assign lead farmers to manage collection points and affiliated farms.

**Props:**
- None (fetches data internally)

**Usage:**
```tsx
import { FarmAffiliationManager } from '@/features/admin';

<FarmAffiliationManager />
```

### KPIHeader
Display key performance indicators with trend comparison.

**Props:**
- None (fetches KPI data internally)

**Usage:**
```tsx
import { KPIHeader } from '@/features/admin';

<KPIHeader />
```

**KPIs Displayed:**
- Total Revenue (with weekly comparison)
- Active Orders (pending + in_transit)
- Products Available (approved products only)
- Revenue Split (88% farmer / 2% lead / 10% platform)

### TaxDocumentGenerator
Generate 1099 tax forms for contractors (farmers & drivers).

**Props:**
- None (year selector form)

**Usage:**
```tsx
import { TaxDocumentGenerator } from '@/features/admin';

<TaxDocumentGenerator />
```

### UserRatingDisplay
Display driver rating with review count.

**Props:**
- `driverId: string` - Driver user ID

**Usage:**
```tsx
import { UserRatingDisplay } from '@/features/admin';

<UserRatingDisplay driverId={userId} />
```

## Query Keys

```typescript
export const adminQueries = {
  all: ['admin'] as const,
  kpis: () => [...adminQueries.all, 'kpis'] as const,
  admins: () => [...adminQueries.all, 'admins'] as const,
  approvals: {
    users: (status: string) => [...adminQueries.all, 'approvals', 'users', status] as const,
    products: (status: string) => [...adminQueries.all, 'approvals', 'products', status] as const,
  },
  affiliations: () => [...adminQueries.all, 'affiliations'] as const,
  disputes: (status?: string) => [...adminQueries.all, 'disputes', status] as const,
};
```

## Error Handling

```typescript
import { AdminError } from '@/features/admin';

throw AdminError.unauthorized();
throw AdminError.approvalFailed(userId, reason);
throw AdminError.creditAwardFailed(consumerId, reason);
```

## Pages Using This Feature

- `/admin/dashboard` - Main admin dashboard with KPIs
- `/admin/roles` - Admin role management
- `/admin/user-approvals` - Approve pending farmers/drivers
- `/admin/product-approval` - Approve pending products
- `/admin/credits` - Award credits to consumers
- `/admin/affiliations` - Manage farm affiliations
- `/admin/tax-documents` - Generate 1099 forms
- `/admin/disputes` - Manage customer disputes
- `/admin/analytics` - Financial reports and trends
- `/admin/audit-log` - System audit trail

## Related Features

- **Consumers**: Credit management and subscriptions
- **Farmers**: Farm affiliations and product approval
- **Drivers**: User approvals and ratings
- **Orders**: Batch management and disputes
- **Payouts**: 1099 generation and payment processing
