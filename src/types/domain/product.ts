/**
 * PRODUCT DOMAIN TYPES
 * Shared type definitions for products across the application
 */

export interface Product {
  id: string;
  farm_profile_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  image_url: string | null;
  available_quantity: number;
  harvest_date: string | null;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithFarm extends Product {
  farm_profiles: {
    id: string;
    farm_name: string;
    farmer_id: string;
    description: string | null;
    location: string | null;
    bio: string | null;
  };
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  unit: string;
  available_quantity: number;
  harvest_date?: string;
  image_url?: string;
}

export interface ProductFilters {
  search?: string;
  farmId?: string;
  minPrice?: number;
  maxPrice?: number;
  approved?: boolean;
}

export type ProductSortField = 'name' | 'price' | 'created_at' | 'harvest_date';
export type SortDirection = 'asc' | 'desc';
