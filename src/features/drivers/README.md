# Driver Feature Module

Delivery route management, navigation, earnings tracking, and batch coordination for drivers.

## Components

### `AvailableRoutes`
Displays unclaimed delivery batches available for drivers to accept. Shows batch details including:
- Delivery date and time window
- Number of stops
- Estimated earnings (delivery fee + potential tips)
- Collection point location
- ZIP code coverage (addresses hidden until pickup)

**Address Privacy**: Only shows ZIP codes and batch-level info before claiming.

### `BoxCodeScanner`
**CRITICAL SECURITY COMPONENT** - Core implementation of address privacy system.

Handles box code verification in two modes:
1. **Loading Mode** (`mode='loading'`): Scan boxes at collection point
   - Creates scan log with `scan_type='loaded'`
   - Sets `address_visible_at` timestamp (unlocks addresses)
   - Enables full address visibility via RLS policy
2. **Delivery Mode** (`mode='delivery'`): Scan boxes at consumer location
   - Verifies correct box at correct address
   - Updates delivery status

**Why This Matters**:
- Prevents route cherry-picking (drivers can't see "good" addresses before claiming)
- Protects consumer privacy (addresses hidden until pickup confirmed)
- Ensures operational fairness

### `RouteDensityMap`
Interactive map visualization showing delivery density by ZIP code. Helps drivers understand route concentration and efficiency.

## Queries

See `queries/index.ts` for full query factory documentation.

Key queries:
- `driverQueries.availableRoutes()` - Unclaimed batches
- `driverQueries.activeBatch(userId)` - Current assigned route
- `driverQueries.routeStops(batchId)` - Delivery stops (RLS-protected)
- `driverQueries.earnings(userId)` - Payment history

## Error Handling

Feature-specific error creators in `errors.ts`:
- `createRouteClaimError()` - Batch claiming failures
- `createDeliveryError()` - Delivery status update errors
- `createBoxScanError()` - Invalid box code scans
- `createDriverPayoutError()` - Payout data fetch errors

## Address Privacy System

### How It Works

**Before Box Scan** (at collection point):
```
Database: address_visible_at = NULL
Driver sees: ZIP code only (e.g., "10001")
UI displays: "Deliveries in ZIP 10001" (no street addresses)
```

**After Box Scan** (at collection point):
```
Database: address_visible_at = NOW()
Driver sees: Full street address (e.g., "123 Main St, Apt 4B")
UI displays: Complete delivery information
```

### Database Implementation

RLS Policy on `batch_stops`:
```sql
CREATE POLICY "Drivers see addresses only after pickup"
ON batch_stops FOR SELECT
TO authenticated
USING (
  CASE 
    WHEN has_role(auth.uid(), 'driver') THEN 
      address_visible_at IS NOT NULL
    ELSE 
      true  -- Consumers/farmers/admins always see addresses
  END
);
```

### Frontend Implementation

- `RouteDetails.tsx` - Uses `driver_batch_stops_secure` view
- `BoxCodeScanner.tsx` - Creates scan log that triggers visibility
- `AvailableRoutes.tsx` - Shows ZIP codes only for unclaimed batches

## Usage Example

```typescript
import { driverQueries, AvailableRoutes, BoxCodeScanner } from '@/features/drivers';

// Get available routes
const { data: routes } = useQuery(driverQueries.availableRoutes());

// Render available routes component
<AvailableRoutes onRouteClaimed={handleClaim} />

// Box scanning at collection point
<BoxCodeScanner 
  mode="loading" 
  batchId={batchId}
  onScanComplete={(orderId, code) => {
    // Address now visible for this order
    refetchStops();
  }}
/>
```

## Security Considerations

- **Never** bypass `driver_batch_stops_secure` view
- **Always** use box scanner for address unlocking
- **Don't** expose raw `batch_stops` table to drivers
- **Validate** scan logs server-side (prevent fake scans)

## Related Documentation

- [ARCHITECTURE.md - Address Privacy](../../ARCHITECTURE.md#operational-safety-driver-address-privacy)
- [SECURITY.md - RLS Policies](../../SECURITY.md)
- [Driver Workflow E2E Tests](../../e2e/driver-workflow.spec.ts)
