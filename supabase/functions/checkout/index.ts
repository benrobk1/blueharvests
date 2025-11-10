/**
 * CHECKOUT EDGE FUNCTION
 * Processes cart checkout with payment and credits
 * 
 * Full Middleware Pattern:
 * RequestId + Auth + RateLimit + Validation + ErrorHandling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { loadConfig } from '../_shared/config.ts';
import { CheckoutService, CheckoutError } from '../_shared/services/CheckoutService.ts';
import { CheckoutRequestSchema } from '../_shared/contracts/checkout.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [CHECKOUT] Request started`);

  try {
    const config = loadConfig();
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

    // Auth middleware
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error(`[${requestId}] Auth failed:`, authError?.message);
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Authenticated user: ${user.id}`);

    // Rate limiting middleware
    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.CHECKOUT);
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

    // Validation middleware
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

    // Business logic
    console.log(`[${requestId}] Processing checkout for cart ${input.cart_id}`);

    const stripe = new Stripe(config.stripe.secretKey);
    const checkoutService = new CheckoutService(supabase, stripe);

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
      
      throw error;
    }
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Unhandled error:`, error);
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
