# Drivers Feature

Centralized module for driver-related functionality including route management, box scanning, and delivery tracking.

## Structure

```
drivers/
├── components/        # UI components
│   ├── AvailableRoutes.tsx
│   ├── BoxCodeScanner.tsx
│   ├── DriverInterface.tsx
│   └── RouteDensityMap.tsx
├── queries/          # React Query hooks
│   └── index.ts
├── types/            # TypeScript types
│   └── index.ts
├── errors.ts         # Feature-specific errors
└── index.ts          # Public exports
```

## Components

### AvailableRoutes
Displays available delivery batches for drivers to claim.

**Props:**
- None (fetches data internally)

**Usage:**
```tsx
import { AvailableRoutes } from '@/features/drivers';

<AvailableRoutes />
```

### BoxCodeScanner
QR/barcode scanner for loading and delivering boxes.

**Props:**
- `mode: 'loading' | 'delivery'` - Scanner mode
- `batchId?: string` - Batch identifier
- `onScanComplete: (orderId: string, boxCode: string) => void` - Callback on successful scan

**Usage:**
```tsx
import { BoxCodeScanner } from '@/features/drivers';

<BoxCodeScanner 
  mode="loading"
  batchId={batchId}
  onScanComplete={(orderId, boxCode) => {
    console.log('Scanned:', boxCode);
  }}
/>
```

### DriverInterface
Mobile-optimized interface for active deliveries.

**Props:**
- `stops: Stop[]` - Array of delivery stops
- `onMarkDelivered: (stopId: string) => void` - Mark stop as delivered
- `onStartNavigation: (stopId: string) => void` - Start navigation to stop

**Usage:**
```tsx
import { DriverInterface } from '@/features/drivers';

<DriverInterface
  stops={stops}
  onMarkDelivered={handleMarkDelivered}
  onStartNavigation={handleStartNavigation}
/>
```

### RouteDensityMap
Visualizes route density and delivery progress.

**Props:**
- `batchId: string` - Batch identifier

**Usage:**
```tsx
import { RouteDensityMap } from '@/features/drivers';

<RouteDensityMap batchId={batchId} />
```

## Types

### Stop
```typescript
interface Stop {
  id: string;
  customer: string;
  address: string;
  status: 'pending' | 'in_progress' | 'delivered';
}
```

### VerifiedOrder
```typescript
interface VerifiedOrder {
  order_id: string;
  box_code: string;
  consumer_name: string;
  delivery_address: string;
}
```

### DeliveryBatch
```typescript
interface DeliveryBatch {
  id: string;
  batch_number: number;
  delivery_date: string;
  status: string;
  estimated_duration_minutes: number | null;
  zip_codes: string[] | null;
}
```

## Query Keys

```typescript
export const driversKeys = {
  all: ['drivers'] as const,
  batches: () => [...driversKeys.all, 'batches'] as const,
  batch: (id: string) => [...driversKeys.batches(), id] as const,
  routes: () => [...driversKeys.all, 'routes'] as const,
  route: (id: string) => [...driversKeys.routes(), id] as const,
};
```

## Error Handling

```typescript
import { DriversError } from '@/features/drivers';

throw DriversError.batchNotFound(batchId);
throw DriversError.scanFailed(reason);
throw DriversError.deliveryFailed(stopId, reason);
```

## Pages Using This Feature

- `/driver/dashboard` - Main driver dashboard
- `/driver/available-routes` - Browse and claim routes
- `/driver/route/:batchId` - Active route details
- `/driver/load-boxes/:batchId` - Box loading interface
- `/profile/driver` - Driver profile and documents

## Related Features

- **Orders**: Delivery stop information
- **Payouts**: Driver earnings and payment history
- **Admin**: Batch assignment and route optimization
