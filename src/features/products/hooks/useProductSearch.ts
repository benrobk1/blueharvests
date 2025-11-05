import { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { preloadImage } from '@/lib/imageHelpers';
import type { Product } from '../types';

/**
 * Hook for client-side product search with image preloading
 * 
 * @description Provides search functionality across product names and farm names
 * with deferred value optimization for performance. Preloads images for top 3 results.
 * 
 * @param products - Array of products to search
 * @returns Search query state, setter, and filtered results
 * 
 * @example
 * ```typescript
 * const { searchQuery, setSearchQuery, filteredProducts } = useProductSearch(products);
 * 
 * <input 
 *   value={searchQuery} 
 *   onChange={(e) => setSearchQuery(e.target.value)}
 * />
 * {filteredProducts.map(product => <ProductCard key={product.id} {...product} />)}
 * ```
 */
export const useProductSearch = (products: Product[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const filteredProducts = useMemo(
    () => products.filter((product) =>
      product.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      product.farm_profiles.farm_name.toLowerCase().includes(deferredSearch.toLowerCase())
    ),
    [products, deferredSearch]
  );

  useEffect(() => {
    filteredProducts.slice(0, 3).forEach(p => {
      if (p.image_url) preloadImage(p.image_url).catch(() => {});
    });
  }, [filteredProducts]);

  return {
    searchQuery,
    setSearchQuery,
    filteredProducts,
  };
};
