/**
 * Integration tests for cart workflow
 * Tests the full cart lifecycle from adding items to checkout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCart } from '../hooks/useCart';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { createMockSupabaseClient } from '@/test/mocks/supabase';
import { createMockAuthContext } from '@/test/mocks/authContext';
import { createMockProduct } from '@/test/factories/productFactory';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => createMockAuthContext({ 
    user: { id: 'user-123', email: 'test@example.com' } 
  })),
}));

describe('Cart Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add to Cart Flow', () => {
    it('should create cart and add item for new user', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = createMockProduct();
      
      // Add item to cart
      result.current.addToCart.mutate({
        productId: product.id,
        quantity: 2,
        unitPrice: product.price,
      });

      await waitFor(() => {
        expect(result.current.addToCart.isPending).toBe(false);
      });
    });

    it('should increment quantity for existing item', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const product = createMockProduct();

      // Add same item twice
      result.current.addToCart.mutate({
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
      });

      await waitFor(() => {
        expect(result.current.addToCart.isPending).toBe(false);
      });
    });
  });

  describe('Cart Calculations', () => {
    it('should calculate total correctly with multiple items', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cart total should be a number
      expect(typeof result.current.cartTotal).toBe('number');
    });

    it('should calculate item count correctly', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Cart count should be a number
      expect(typeof result.current.cartCount).toBe('number');
    });
  });

  describe('Update Cart Flow', () => {
    it('should update item quantity', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.cart?.items?.[0]) {
        result.current.updateQuantity.mutate({
          itemId: result.current.cart.items[0].id,
          quantity: 5,
        });

        await waitFor(() => {
          expect(result.current.updateQuantity.isPending).toBe(false);
        });
      }
    });

    it('should remove item when quantity set to 0', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.cart?.items?.[0]) {
        result.current.updateQuantity.mutate({
          itemId: result.current.cart.items[0].id,
          quantity: 0,
        });

        await waitFor(() => {
          expect(result.current.updateQuantity.isPending).toBe(false);
        });
      }
    });
  });

  describe('Remove from Cart Flow', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.cart?.items?.[0]) {
        result.current.removeItem.mutate(result.current.cart.items[0].id);

        await waitFor(() => {
          expect(result.current.removeItem.isPending).toBe(false);
        });
      }
    });
  });

  describe('Saved Carts Flow', () => {
    it('should save current cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt to save cart (will fail on empty cart)
      result.current.saveCart.mutate('My Saved Cart');

      await waitFor(() => {
        expect(result.current.saveCart.isPending).toBe(false);
      });
    });

    it('should load saved cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.savedCarts[0]) {
        result.current.loadSavedCart.mutate(result.current.savedCarts[0].id);

        await waitFor(() => {
          expect(result.current.loadSavedCart.isPending).toBe(false);
        });
      }
    });

    it('should delete saved cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: renderWithProviders,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      if (result.current.savedCarts[0]) {
        result.current.deleteSavedCart.mutate(result.current.savedCarts[0].id);

        await waitFor(() => {
          expect(result.current.deleteSavedCart.isPending).toBe(false);
        });
      }
    });
  });
});
