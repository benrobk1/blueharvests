/**
 * UI CONSTANTS
 * Centralized UI-related constants (polling intervals, timeouts, limits, etc.)
 */

// Polling and refresh intervals (in milliseconds)
export const POLLING_INTERVALS = {
  ACTIVE_ORDER: 30000,           // 30 seconds - Live tracking updates
  CART_SYNC: 60000,              // 1 minute - Cart synchronization
  NOTIFICATIONS: 60000,          // 1 minute - Notification checks
  SUBSCRIPTION_CHECK: 300000,    // 5 minutes - Subscription status
} as const;

// Request timeouts (in milliseconds)
export const TIMEOUTS = {
  DEFAULT_REQUEST: 30000,        // 30 seconds
  FILE_UPLOAD: 120000,           // 2 minutes
  PAYMENT: 60000,                // 1 minute
} as const;

// Order status mapping for display
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Order status display labels
export const ORDER_STATUS_LABELS: Record<string, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparing',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Ready for Pickup',
  [ORDER_STATUS.IN_TRANSIT]: 'In Transit',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PRODUCTS_PER_PAGE: 24,
  ORDERS_PER_PAGE: 10,
} as const;

// Input validation limits
export const INPUT_LIMITS = {
  MAX_PRODUCT_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_ADDRESS_LENGTH: 200,
  MAX_PHONE_LENGTH: 20,
  MAX_EMAIL_LENGTH: 255,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 5,
  MAX_DOCUMENT_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// Animation durations (in milliseconds)
export const ANIMATION = {
  FAST: 150,
  DEFAULT: 300,
  SLOW: 500,
  TOAST_DURATION: 5000,
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 150,
} as const;

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 13,
  MAX_ZOOM: 18,
  MIN_ZOOM: 8,
  ROUTE_LINE_WIDTH: 3,
  MARKER_SIZE: 32,
} as const;

// Notification settings
export const NOTIFICATION = {
  MAX_VISIBLE_TOASTS: 3,
  DEFAULT_DURATION: 5000,
  ERROR_DURATION: 7000,
  SUCCESS_DURATION: 3000,
} as const;

// Search and filter
export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  DEBOUNCE_DELAY: DEBOUNCE.SEARCH,
} as const;

// Rating system
export const RATING = {
  MIN_STARS: 1,
  MAX_STARS: 5,
  DEFAULT_STARS: 0,
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
  PRODUCTS: 5 * 60 * 1000,       // 5 minutes
  USER_PROFILE: 10 * 60 * 1000,  // 10 minutes
  MARKET_CONFIG: 30 * 60 * 1000, // 30 minutes
  STATIC_DATA: 60 * 60 * 1000,   // 1 hour
} as const;

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;
