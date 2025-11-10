/**
 * PROCESS PAYOUTS EDGE FUNCTION
 * Admin-only function to process pending farmer payouts via Stripe
 * 
 * Full Middleware Pattern:
 * RequestId + CORS + Auth + AdminAuth + RateLimit + ErrorHandling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { PayoutService } from '../_shared/services/PayoutService.ts';
import {
  withRequestId,
  withCORS,
  withAuth,
  withAdminAuth,
  withRateLimit,
  withErrorHandling,
  createMiddlewareStack,
} from '../_shared/middleware/index.ts';

type PayoutContext = {
  requestId: string;
  corsHeaders: Record<string, string>;
  user: any;
  supabase: any;
  config: any;
};

const handler = async (req: Request, ctx: PayoutContext) => {
  const { requestId, corsHeaders, supabase, config } = ctx;

  console.log(`[${requestId}] Processing pending payouts`);

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
};

// Compose middleware manually
const composed = withErrorHandling(
  withRequestId(
    withCORS(
      withAuth(
        withAdminAuth(
          withRateLimit(RATE_LIMITS.PROCESS_PAYOUTS)(handler)
        )
      )
    )
  )
);

serve(async (req) => {
  const config = loadConfig();
  const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  return composed(req, { supabase, config });
});
