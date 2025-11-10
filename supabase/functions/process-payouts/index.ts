/**
 * PROCESS PAYOUTS EDGE FUNCTION
 * Admin-only function to process pending farmer payouts via Stripe
 * 
 * Full Middleware Pattern:
 * RequestId + Auth + Admin Check + RateLimit + ErrorHandling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { PayoutService } from '../_shared/services/PayoutService.ts';
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
  console.log(`[${requestId}] [PAYOUTS] Request started`);

  try {
    const config = loadConfig();
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

    // Auth middleware
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin check
    const { data: hasAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required', code: 'UNAUTHORIZED' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Admin user ${user.id} authorized`);

    // Rate limiting
    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.PROCESS_PAYOUTS);
    if (!rateCheck.allowed) {
      console.warn(`[${requestId}] Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'TOO_MANY_REQUESTS',
        message: 'Please wait before processing payouts again.',
        retryAfter: rateCheck.retryAfter 
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfter || 60),
        }
      });
    }

    // Business logic
    const stripe = new Stripe(config.stripe.secretKey);
    const payoutService = new PayoutService(supabase, stripe);
    const result = await payoutService.processPendingPayouts();

    console.log(`[${requestId}] ✅ Payouts complete: ${result.successful} successful, ${result.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        payouts_processed: result.successful + result.failed,
        total_amount: 0,
        failures: result.errors.length > 0 ? result.errors.map(e => ({
          payout_id: e.payoutId,
          error: e.error
        })) : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] ❌ Payout processing error:`, error);
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
