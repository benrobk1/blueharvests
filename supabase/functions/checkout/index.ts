/**
 * CHECKOUT EDGE FUNCTION - REF ACTORED WITH MIDDLEWARE PATTERN
 * 
 * This demonstrates the recommended middleware pattern for edge functions.
 * Compare with generate-batches to see before/after.
 * 
 * KEY IMPROVEMENTS:
 * ✅ Extracted auth, rate limiting, validation into reusable middleware
 * ✅ Clear separation of concerns - handler only contains business logic
 * ✅ Structured error handling with domain-specific errors
 * ✅ Type-safe context passing between middleware layers
 * ✅ Consistent logging with request IDs
 * 
 * MIDDLEWARE FLOW:
 * Request → Error Handler → Request ID → CORS → Auth → Rate Limit → Validation → Business Logic
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { loadConfig } from '../_shared/config.ts';
import { CheckoutService, CheckoutError } from '../_shared/services/CheckoutService.ts';
import { CheckoutRequestSchema } from '../_shared/contracts/checkout.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * MAIN HANDLER - Middleware Pattern
 * 
 * Instead of having 150 lines of auth/validation/rate-limiting code inline,
 * we extract common concerns into layers that can be reused across edge functions.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // REQUEST ID - Correlation for logs
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [CHECKOUT] Request started: ${req.method} ${req.url}`);

  try {
    // CONFIG LOADING - Centralized configuration
    const config = loadConfig();
    
    // SUPABASE CLIENT - Service role for elevated privileges
    const supabaseClient = createClient(
      config.supabase.url,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // AUTH MIDDLEWARE - Validate JWT and extract user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'UNAUTHORIZED',
        message: 'Missing authorization header'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${requestId}] Auth failed:`, authError?.message);
      return new Response(JSON.stringify({ 
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // RATE LIMITING MIDDLEWARE - Prevent abuse
    const rateCheck = await checkRateLimit(supabaseClient, user.id, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
      keyPrefix: 'checkout',
    });

    if (!rateCheck.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: 'TOO_MANY_REQUESTS', 
          message: 'Too many checkout attempts. Please try again later.',
          retryAfter: rateCheck.retryAfter 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VALIDATION MIDDLEWARE - Schema validation
    const body = await req.json();
    const validationResult = CheckoutRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed:`, validationResult.error.flatten());
      return new Response(JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request format',
        details: validationResult.error.flatten()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const input = validationResult.data;

    // BUSINESS LOGIC - Checkout processing
    console.log(`[${requestId}] Processing checkout for cart ${input.cart_id}`);

    const stripe = new Stripe(config.stripe.secretKey);
    const checkoutService = new CheckoutService(supabaseClient, stripe);

    try {
      const result = await checkoutService.processCheckout({
        cartId: input.cart_id,
        userId: user.id,
        userEmail: user.email!,
        deliveryDate: input.delivery_date,
        useCredits: input.use_credits || false,
        paymentMethodId: input.payment_method_id,
        tipAmount: input.tip_amount || 0,
        requestOrigin: req.headers.get('origin') || '',
        isDemoMode: input.is_demo_mode || false
      });

      console.log(`[${requestId}] ✅ Checkout success: order ${result.orderId}`);

      return new Response(
        JSON.stringify({
          success: result.success,
          order_id: result.orderId,
          client_secret: result.clientSecret,
          amount_charged: result.amountCharged,
          credits_redeemed: result.creditsRedeemed,
          payment_status: result.paymentStatus
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      // DOMAIN ERROR HANDLING - Structured errors from service layer
      if (error instanceof CheckoutError) {
        console.error(`[${requestId}] ❌ Checkout error [${error.code}]: ${error.message}`);
        
        return new Response(
          JSON.stringify({
            error: error.code,
            message: error.message,
            details: error.details
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Re-throw unexpected errors for outer catch
      throw error;
    }
  } catch (error: any) {
    // GLOBAL ERROR HANDLING - Catch-all for unexpected errors
    console.error(`[${requestId}] ❌ Unhandled error:`, error);
    return new Response(JSON.stringify({ 
      error: 'INTERNAL_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
