/**
 * ORDER DOMAIN TYPES
 * Shared type definitions for orders across the application
 */

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  consumer_id: string;
  delivery_date: string;
  delivery_batch_id: string | null;
  total_amount: number;
  tip_amount: number;
  status: OrderStatus;
  box_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderItemWithProduct extends OrderItem {
  products: {
    id: string;
    name: string;
    unit: string;
    image_url: string | null;
  };
}

export interface OrderWithDetails extends Order {
  order_items: OrderItemWithProduct[];
  profiles?: {
    full_name: string;
    street_address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    phone: string | null;
  };
  delivery_batches?: {
    driver_id: string | null;
    estimated_duration_minutes: number | null;
    profiles: {
      full_name: string;
      phone: string | null;
    } | null;
  };
}

export interface CreateOrderData {
  consumer_id: string;
  delivery_date: string;
  total_amount: number;
  tip_amount?: number;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
  }[];
}

export interface OrderSummary {
  id: string;
  delivery_date: string;
  total_amount: number;
  status: OrderStatus;
  item_count: number;
}
