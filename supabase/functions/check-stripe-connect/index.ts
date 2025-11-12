import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { 
  withRequestId, 
  withCORS, 
  withAuth,
  withRateLimit,
  withErrorHandling, 
  createMiddlewareStack,
  type RequestIdContext,
  type CORSContext,
  type AuthContext
} from '../_shared/middleware/index.ts';

/**
 * CHECK STRIPE CONNECT STATUS
 * 
 * Verifies Stripe Connect onboarding status and syncs with local database.
 * High-traffic read endpoint with generous rate limiting.
 */

type Context = RequestIdContext & CORSContext & AuthContext;

/**
 * Main handler with middleware composition
 */
const handler = async (req: Request, ctx: Context): Promise<Response> => {
  const config = loadConfig();
  const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  const user = ctx.user;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_connect_account_id) {
    console.log(`[${ctx.requestId}] ℹ️ No Stripe account for user ${user.id}`);
    return new Response(JSON.stringify({
      connected: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false
    }), {
      status: 200,
      headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Initialize Stripe
  const stripe = new Stripe(config.stripe.secretKey, {
    // Using account default API version for compatibility
  });

  // Get account details from Stripe
  const account = await stripe.accounts.retrieve(profile.stripe_connect_account_id);

  const onboardingComplete = account.details_submitted || false;
  const chargesEnabled = account.charges_enabled || false;
  const payoutsEnabled = account.payouts_enabled || false;

  // Update profile with latest status
  await supabase
    .from('profiles')
    .update({
      stripe_onboarding_complete: onboardingComplete,
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled
    })
    .eq('id', user.id);

  console.log(`[${ctx.requestId}] ✅ Stripe Connect status synced for user ${user.id}`, {
    onboardingComplete,
    chargesEnabled,
    payoutsEnabled
  });

  return new Response(JSON.stringify({
    connected: true,
    onboarding_complete: onboardingComplete,
    charges_enabled: chargesEnabled,
    payouts_enabled: payoutsEnabled,
    account_id: profile.stripe_connect_account_id
  }), {
    status: 200,
    headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Compose middleware stack
const middlewareStack = createMiddlewareStack<Context>([
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit(RATE_LIMITS.CHECK_STRIPE_CONNECT),
  withErrorHandling
]);

serve((req) => middlewareStack(handler)(req, {} as any));
