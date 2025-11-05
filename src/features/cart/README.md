# Cart Feature Module

Shopping cart management with save/load capabilities and offline support.

## Components

### `CartDrawer`
Slide-out cart panel displaying:
- Cart items with product details
- Quantity selectors
- Remove item buttons
- Subtotal calculation
- Checkout button
- Empty state

### `SaveCartDialog`
Modal for saving current cart as a template:
- Cart name input
- Save for later functionality
- Useful for recurring orders

### `SavedCartsList`
Displays user's saved carts:
- Cart name and item count
- Last updated timestamp
- Load cart button
- Delete saved cart

### `CartItemSkeleton`
Loading skeleton for cart items during data fetch.

## Hooks

### `useCart(userId)`
Main cart data hook. Returns:
- `cart` - Current shopping cart
- `items` - Cart items with product details
- `totals` - Calculated totals
- `isLoading` - Loading state
- Automatic refetch on mutations

### `useCartActions()`
Cart action state management:
- `isAdding` - Add to cart loading state
- `justAdded` - Success animation trigger
- `quantity` - Selected quantity
- `handleAddToCart(fn)` - Add to cart wrapper
- `incrementQuantity(max)` - Increase quantity
- `decrementQuantity()` - Decrease quantity

## Queries

See `queries/index.ts` for documentation.

Key queries:
- `cartQueries.current(userId)` - Active shopping cart
- `cartQueries.items(cartId)` - Cart items with products
- `cartQueries.totals(userId)` - Calculated totals
- `cartQueries.saved.all(userId)` - Saved cart templates
- `cartQueries.saved.detail(savedCartId)` - Saved cart details

## Types

### `CartItem`
```typescript
{
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}
```

### `CartItemWithProduct`
```typescript
{
  ...CartItem,
  products: Product;
}
```

### `CartTotals`
```typescript
{
  subtotal: number;
  deliveryFee: number;
  tip: number;
  credits: number;
  total: number;
}
```

## Error Handling

Feature-specific errors:
- `createAddToCartError()` - Failed to add item
- `createRemoveFromCartError()` - Failed to remove item
- `createUpdateCartError()` - Failed to update quantity
- `createSaveCartError()` - Failed to save cart template
- `createLoadCartError()` - Failed to load saved cart

## Usage Example

```typescript
import { 
  useCart, 
  useCartActions, 
  CartDrawer,
  createAddToCartError 
} from '@/features/cart';
import { useErrorHandler } from '@/lib/errors/useErrorHandler';

function Shop() {
  const { cart, items, totals } = useCart(userId);
  const { handleAddToCart, quantity } = useCartActions();
  const { handleError } = useErrorHandler();

  const addToCart = async (productId: string) => {
    try {
      await handleAddToCart(async () => {
        const { error } = await supabase
          .from('cart_items')
          .insert({ cart_id: cart.id, product_id: productId, quantity });
        
        if (error) throw error;
      });
    } catch (error) {
      handleError(createAddToCartError());
    }
  };

  return (
    <>
      <ProductGrid onAddToCart={addToCart} />
      <CartDrawer cart={cart} items={items} totals={totals} />
    </>
  );
}
```

## Offline Support

Cart data syncs between:
1. **Database** - Persistent storage via Supabase
2. **LocalStorage** - Offline cart via `offlineCart` lib
3. **React Query Cache** - In-memory state

Sync behavior:
- Add to cart → writes to DB + localStorage
- App load → checks DB first, falls back to localStorage
- Checkout → clears both DB and localStorage

## Saved Carts

Use cases:
- Recurring weekly orders
- Quick re-order of favorites
- Multiple cart templates

Implementation:
```typescript
// Save current cart
const { data: savedCart } = await supabase
  .from('saved_carts')
  .insert({
    user_id: userId,
    name: 'Weekly Produce',
    cart_snapshot: items
  });

// Load saved cart
const loadCart = async (savedCartId: string) => {
  const { data } = await supabase
    .from('saved_carts')
    .select('cart_snapshot')
    .eq('id', savedCartId)
    .single();

  // Restore items to current cart
  await Promise.all(
    data.cart_snapshot.map(item =>
      supabase.from('cart_items').insert({
        cart_id: currentCart.id,
        product_id: item.product_id,
        quantity: item.quantity
      })
    )
  );
};
```

## Related Documentation

- [Checkout Flow](../orders/README.md)
- [Product Catalog](../products/README.md)
- [Offline Cart Implementation](../../lib/offlineCart.ts)
