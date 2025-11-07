# Farmers Feature

Centralized module for farmer-related functionality including inventory management, batch coordination, product management, and payment processing.

## Structure

```
farmers/
├── components/        # UI components
│   ├── BatchConsolidation.tsx
│   ├── BoxCodeDisplay.tsx
│   ├── BulkEditDialog.tsx
│   ├── CSVProductImport.tsx
│   ├── LeadFarmerInfoCard.tsx
│   ├── MultiFarmDashboard.tsx
│   ├── NextOrderCutoffCard.tsx
│   ├── ProductForm.tsx
│   ├── StripeConnectSimple.tsx
│   ├── ValidationPreviewTable.tsx
│   └── WeeklyInventoryReview.tsx
├── queries/          # React Query hooks
│   └── index.ts
├── errors.ts         # Feature-specific errors
└── index.ts          # Public exports
```

### `ProductForm`
Modal form for adding and editing farm products. Includes:
- Product name, description
- Price and unit (lb, oz, bunch, etc.)
- Available quantity
- Image URL (optional)
- Form validation with Zod schema

### `CSVProductImport`
Bulk product import via CSV/Excel files. Features:
- Template download (CSV format)
- File upload with validation
- Preview with error highlighting
- Batch import (5 products at a time)
- Progress tracking

### `BulkEditDialog`
Advanced bulk operations for product management:
- Create mode: Import new products
- Update mode: Export → edit → re-import
- Inline cell editing in preview
- Image URL support with upload
- Detailed validation feedback

### `BatchConsolidation`
Lead farmer interface for managing batches from multiple affiliated farms. Shows:
- Orders grouped by farm
- Total quantities per product
- Box code assignments
- Collection point logistics

### `MultiFarmDashboard`
Lead farmer overview showing:
- Aggregate earnings across all farms
- Top-performing affiliated farms
- Product catalog across all farms
- Batch history and status

### `WeeklyInventoryReview`
Weekly reminder system for farmers to update product availability. Features:
- Products pending review
- Quick quantity updates
- Mark as reviewed

### `NextOrderCutoffCard`
Displays next order cutoff time with countdown. Helps farmers know when to have products ready.

### `LeadFarmerInfoCard`
Shows collection point info for farmers affiliated with a lead farmer.

### `StripeConnectSimple`
Stripe Connect onboarding for payout setup. Handles:
- Account creation
- Verification status
- Onboarding link generation

### `BoxCodeDisplay`
Shows assigned box codes for orders at collection point.

### `ValidationPreviewTable`
Displays CSV import preview with inline editing and error highlighting.

## Queries

See `queries/index.ts` for full documentation.

Key queries:
- `farmerQueries.profile(userId)` - Farmer profile
- `farmerQueries.products(farmProfileId)` - Product catalog
- `farmerQueries.leadFarmer.batches(userId)` - Lead farmer batches
- `farmerQueries.affiliatedFarms(userId)` - Affiliated farm list
- `farmerQueries.aggregateEarnings(userId)` - Multi-farm earnings

## Error Handling

Feature-specific error creators:
- `createProductError()` - Product CRUD failures
- `createInventoryError()` - Inventory update errors
- `createCSVImportError()` - CSV parsing/validation errors
- `createInvalidFileError()` - File type validation
- `createBatchError()` - Batch operation failures
- `createFarmerPayoutError()` - Payout data errors
- `createStripeConnectError()` - Stripe account issues

## Usage Example

```typescript
import { 
  farmerQueries, 
  ProductForm, 
  CSVProductImport,
  createProductError 
} from '@/features/farmers';
import { useErrorHandler } from '@/lib/errors/useErrorHandler';

// Get farmer products
const { data: products } = useQuery(farmerQueries.products(farmProfileId));

// Handle product save
const { handleError } = useErrorHandler();
try {
  await saveProduct(data);
} catch (error) {
  handleError(createProductError('Failed to save product'));
}

// Render product form
<ProductForm
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSave}
/>

// CSV import
<CSVProductImport
  open={showImport}
  onOpenChange={setShowImport}
  farmProfileId={farmId}
  onImportComplete={refetch}
/>
```

## CSV Import Format

Template columns:
```csv
name,description,price,unit,available_quantity,image_url
Organic Tomatoes,Fresh heirloom tomatoes,4.99,lb,50,https://...
Basil Bunch,Fresh Italian basil,2.99,bunch,20,
```

Required fields:
- `name` - Product name (1-100 chars)
- `price` - Decimal price
- `unit` - lb, oz, kg, bunch, each, dozen
- `available_quantity` - Integer >= 0

Optional fields:
- `description` - Product description (max 500 chars)
- `image_url` - Valid HTTPS URL

## Lead Farmer System

Lead farmers manage collection points where multiple farmers deliver products.

### Responsibilities
- Provide collection point address
- Coordinate batch pickup times
- Receive 2% commission on affiliated farmer sales
- Consolidate orders from multiple farms

### Affiliate Management
```typescript
// Get affiliated farms
const { data: farms } = useQuery(
  farmerQueries.affiliatedFarms(leadFarmerId)
);

// Get aggregate earnings
const { data: earnings } = useQuery(
  farmerQueries.aggregateEarnings(leadFarmerId)
);
```

## Related Documentation

- [ARCHITECTURE-FEATURES.md - Farmer Features](../../ARCHITECTURE-FEATURES.md)
- [Revenue Model](../../ARCHITECTURE.md#revenue-model)
- [Product Approval Flow](../../ARCHITECTURE-FEATURES.md#admin-product-approval)
