import { useState } from 'react';

/**
 * Cart action state management hook
 * 
 * @description Manages UI state for add-to-cart operations including loading state,
 * success feedback, and quantity controls.
 * 
 * @returns Cart action handlers and state
 * 
 * @example
 * ```typescript
 * const { quantity, isAdding, justAdded, incrementQuantity, handleAddToCart } = useCartActions();
 * 
 * <button onClick={() => handleAddToCart(async () => await addItem())}>
 *   {justAdded ? '✓ Added' : 'Add to Cart'}
 * </button>
 * ```
 */
export const useCartActions = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async (
    addToCartFn: () => Promise<void>
  ) => {
    setIsAdding(true);
    await addToCartFn();
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setQuantity(1);
    }, 2000);
  };

  const incrementQuantity = (maxQuantity: number) => {
    if (quantity < maxQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return {
    isAdding,
    justAdded,
    quantity,
    setQuantity,
    handleAddToCart,
    incrementQuantity,
    decrementQuantity,
  };
};
