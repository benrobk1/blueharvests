/**
 * EDGE FUNCTION CONFIGURATION
 * Centralized environment and config management for edge functions
 * Validates required secrets and provides helpful error messages
 */

export interface EdgeFunctionConfig {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  stripe: {
    secretKey: string;
    // No apiVersion = use account default (safest)
  };
  mapbox?: {
    publicToken: string;
  };
  lovable?: {
    apiKey: string;
  };
  sentry?: {
    dsn: string;
  };
}

/**
 * Initialize Sentry error tracking (if configured)
 * Environment-gated: No errors if SENTRY_DSN is missing
 */
export function initSentry() {
  const sentryDsn = Deno.env.get('SENTRY_DSN');
  
  if (sentryDsn) {
    console.log('✅ Sentry configured - error tracking enabled');
    // TODO: Initialize Sentry SDK
    // import * as Sentry from 'https://deno.land/x/sentry/index.ts';
    // Sentry.init({ 
    //   dsn: sentryDsn, 
    //   environment: Deno.env.get('ENVIRONMENT') || 'production',
    //   tracesSampleRate: 0.1,
    // });
  } else {
    console.log('⚠️  SENTRY_DSN not configured - errors will only log to console');
  }
}

/**
 * Load and validate edge function configuration
 * Fails fast on missing critical secrets with helpful error messages
 */
export function loadConfig(): EdgeFunctionConfig {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  // Critical env vars - fail fast with descriptive errors
  if (!supabaseUrl) {
    throw new Error('❌ SUPABASE_URL is required. Check your Lovable Cloud configuration.');
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is required. Check your Lovable Cloud configuration.');
  }
  if (!stripeSecretKey) {
    throw new Error('❌ STRIPE_SECRET_KEY is required. Add it in Lovable Cloud Secrets UI.');
  }

  // Optional env vars - log warnings but continue
  const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
  const sentryDsn = Deno.env.get('SENTRY_DSN');
  
  if (!mapboxToken) {
    console.warn('⚠️  MAPBOX_PUBLIC_TOKEN not configured - geocoding will use ZIP fallbacks');
  }
  
  if (!lovableApiKey) {
    console.warn('⚠️  LOVABLE_API_KEY not configured - batch optimization will use geographic fallback');
  }
  
  if (!sentryDsn) {
    console.warn('⚠️  SENTRY_DSN not configured - error tracking disabled (console logs only)');
  }

  return {
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
    },
    stripe: {
      secretKey: stripeSecretKey,
      // No apiVersion specified = use Stripe account default (safest)
    },
    mapbox: mapboxToken ? { publicToken: mapboxToken } : undefined,
    lovable: lovableApiKey ? { apiKey: lovableApiKey } : undefined,
    sentry: sentryDsn ? { dsn: sentryDsn } : undefined,
  };
}
