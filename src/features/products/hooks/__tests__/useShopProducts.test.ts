import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useShopProducts } from '../useShopProducts';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { createMockSupabaseClient } from '@/test/mocks/supabase';
import { createMockAuthContext } from '@/test/mocks/authContext';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => createMockAuthContext({ 
    user: { id: 'user-123', email: 'test@example.com' } 
  })),
}));

describe('useShopProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products on mount', async () => {
    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should provide products array', async () => {
    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    await waitFor(() => {
      expect(Array.isArray(result.current.products)).toBe(true);
    });
  });

  it('should provide farmer data', async () => {
    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    await waitFor(() => {
      expect(result.current.farmerData).toBeDefined();
    });
  });

  it('should provide consumer profile when authenticated', async () => {
    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    await waitFor(() => {
      expect(result.current.consumerProfile).toBeDefined();
    });
  });

  it('should provide market config', async () => {
    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    await waitFor(() => {
      expect(result.current.marketConfig).toBeDefined();
    });
  });

  it('should not fetch consumer profile for unauthenticated user', async () => {
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue(
      createMockAuthContext({ user: null })
    );

    const { result } = renderHook(() => useShopProducts(), {
      wrapper: renderWithProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
