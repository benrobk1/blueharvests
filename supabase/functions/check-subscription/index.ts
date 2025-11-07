/**
 * CHECK SUBSCRIPTION EDGE FUNCTION
 * 
 * Purpose:
 * - Verifies if an authenticated user has an active Stripe subscription
 * - Synchronizes subscription data between Stripe and local database
 * - Calculates available credits and progress toward earning new credits
 * - Tracks trial period status and monthly spending
 * 
 * Business Model:
 * - Subscription Cost: $9.99/month (SUBSCRIPTION.MONTHLY_PRICE_USD from constants)
 * - Credit Rewards: Earn $10 credit for every $100 spent (CREDITS.EARNINGS_THRESHOLD)
 * - Credit Value: Each credit worth $10 (CREDITS.VALUE_PER_CREDIT)
 * - Credit Expiration: Credits expire after 30 days (CREDITS.EXPIRATION_DAYS)
 * - Trial Period: Supports Stripe trial subscriptions (default 60 days)
 * 
 * Authentication:
 * - Requires valid JWT token in Authorization header
 * - Token validated using Supabase Auth (anon key client)
 * - Database operations use service role key to bypass RLS
 * 
 * Called By:
 * - Frontend on user login
 * - Frontend on initial page load
 * - Frontend periodic refresh (every minute)
 * - After checkout completion to sync subscription status
 * 
 * Returns:
 * - subscribed: boolean - Whether user has active subscription
 * - subscription_end: ISO date - When current period ends
 * - is_trialing: boolean - Whether subscription is in trial period
 * - trial_end: ISO date - When trial ends (if applicable)
 * - monthly_spend: number - Current month's spending in USD
 * - credits_available: number - Available credit balance
 * - progress_to_credit: number - Percentage progress (0-100) toward next $10 credit
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

/**
 * CORS Configuration
 * Allows frontend application to call this edge function from any origin
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Structured Logging Helper
 * Provides consistent log format with function name prefix for debugging
 */
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  /**
   * DUAL SUPABASE CLIENT PATTERN
   * 
   * Why two clients?
   * 
   * 1. supabaseAuth (ANON KEY):
   *    - Used for validating user JWT tokens
   *    - Respects user context and permissions
   *    - Cannot bypass Row Level Security (RLS)
   *    - Used for: auth.getUser() to validate token
   * 
   * 2. supabaseClient (SERVICE ROLE KEY):
   *    - Full admin access to database
   *    - Bypasses all RLS policies
   *    - Required for updating subscription records
   *    - Used for: Database queries and upserts
   * 
   * This pattern ensures secure token validation while allowing
   * necessary admin operations for subscription synchronization.
   */
  
  // Client for validating user JWT tokens (user context)
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Client for database operations (admin context, bypasses RLS)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    /**
     * ENVIRONMENT VALIDATION
     * Verify required secrets are configured
     */
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    /**
     * USER AUTHENTICATION & VALIDATION
     * 
     * Steps:
     * 1. Extract JWT token from Authorization header
     * 2. Validate token using Supabase Auth (anon key client)
     * 3. Extract user ID and email for Stripe customer lookup
     * 
     * Security:
     * - JWT validation ensures only authenticated users can check subscription
     * - Email is required to match Stripe customer records
     */
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Use anon key client for authenticating user JWT (respects user context)
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    /**
     * LOCAL SUBSCRIPTION DATA LOOKUP
     * 
     * Check existing subscription record in local database
     * This contains monthly_spend tracking and credits_earned
     * Used as fallback if Stripe customer doesn't exist yet
     */
    const { data: localSub } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('consumer_id', user.id)
      .single();

    logStep("Local subscription fetched", { localSub });

    /**
     * STRIPE CUSTOMER LOOKUP
     * 
     * Find Stripe customer by email address
     * Email is the single source of truth for matching users to customers
     * 
     * Note: Customer is created during first checkout session
     * If no customer exists, user has never attempted to subscribe
     */
    const stripe = new Stripe(stripeKey, {
      // Using account default API version for compatibility
    });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    // No Stripe customer = never subscribed, return default state
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        monthly_spend: localSub?.monthly_spend || 0,
        credits_available: 0,
        progress_to_credit: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    /**
     * SUBSCRIPTION STATUS CHECK
     * 
     * Query Stripe for active subscriptions
     * Status "active" includes both:
     * - Active paying subscriptions
     * - Trial subscriptions (status='trialing' in Stripe)
     * 
     * Subscription Data:
     * - current_period_end: When subscription renews (timestamp in seconds)
     * - trial_end: When trial ends (null if not in trial)
     * - status: 'active' or 'trialing'
     */
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;
    let trialEnd = null;
    let isTrialing = false;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      
      // Convert Stripe timestamps (seconds) to ISO date strings
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      isTrialing = subscription.status === 'trialing';
      
      // Trial end is only set if subscription has/had a trial period
      if (subscription.trial_end) {
        trialEnd = new Date(subscription.trial_end * 1000).toISOString();
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        isTrialing,
        trialEnd
      });

      /**
       * LOCAL DATABASE SYNCHRONIZATION
       * 
       * Upsert subscription data to local database
       * This creates a local cache of subscription status and enables:
       * - Faster subscription checks (no Stripe API call needed)
       * - Monthly spend tracking across subscription periods
       * - Credits earned calculation
       * 
       * Preserved Fields:
       * - monthly_spend: Current month's spending (preserved from local record)
       * - credits_earned: Total credits earned (preserved from local record)
       * 
       * Updated Fields:
       * - stripe_subscription_id: Current Stripe subscription ID
       * - stripe_customer_id: Stripe customer ID
       * - status: 'trialing' or 'active'
       * - current_period_start/end: Subscription billing period
       * - trial_end: When trial ends (if applicable)
       */
      await supabaseClient
        .from('subscriptions')
        .upsert({
          consumer_id: user.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          status: isTrialing ? 'trialing' : 'active',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          trial_end: trialEnd,
          monthly_spend: localSub?.monthly_spend || 0,
          credits_earned: localSub?.credits_earned || 0,
        }, { onConflict: 'consumer_id' });
    } else {
      logStep("No active subscription found");
    }

    /**
     * CREDITS CALCULATION
     * 
     * Query credits_ledger for current balance
     * The ledger tracks all credit transactions:
     * - Credit earned from spending (earn $10 per $100 spent)
     * - Credits used during checkout
     * - Credits expired (after 30 days)
     * 
     * balance_after in the latest record = current available balance
     * 
     * Note: Expired credits are automatically subtracted by the checkout
     * edge function when processing orders
     */
    const { data: availableCredits } = await supabaseClient
      .from('credits_ledger')
      .select('balance_after')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const creditsAvailable = availableCredits?.[0]?.balance_after || 0;

    /**
     * MONTHLY SPEND TRACKING
     * 
     * Track spending progress toward earning next credit
     * 
     * Business Logic:
     * - Spending resets each calendar month (YYYY-MM)
     * - Earn $10 credit for every $100 spent (CREDITS.EARNINGS_THRESHOLD)
     * - Progress shown as percentage (0-100%)
     * 
     * Example:
     * - $0 spent = 0% progress
     * - $50 spent = 50% progress
     * - $100 spent = 100% progress, credit awarded
     * - $150 spent = 150% (capped at 100% for display)
     * 
     * Note: Multiple credits can be earned in same month
     * (e.g., $250 spent = 2 credits, working toward 3rd)
     */
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlySpend = localSub?.monthly_spend_period === currentMonth ? (localSub?.monthly_spend || 0) : 0;
    
    // Calculate progress: (spent / threshold) * 100, capped at 100%
    const progressToCredit = Math.min((monthlySpend / 100) * 100, 100);

    /**
     * RESPONSE SCHEMA
     * 
     * Returns subscription status and related financial data
     * 
     * Fields:
     * - subscribed: boolean - Has active subscription (including trial)
     * - subscription_end: ISO date - When current billing period ends
     * - is_trialing: boolean - Currently in trial period (no charges yet)
     * - trial_end: ISO date - When trial ends (null if not in trial)
     * - monthly_spend: number - Current calendar month spending in USD
     * - credits_available: number - Available credit balance (not expired)
     * - progress_to_credit: number - Percentage (0-100) toward next $10 credit
     * 
     * Used By Frontend To:
     * - Show/hide premium features
     * - Display subscription status in UI
     * - Show trial countdown
     * - Display credit balance and spending progress
     * - Trigger subscription prompts for non-subscribers
     */
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
      trial_end: trialEnd,
      monthly_spend: monthlySpend,
      credits_available: creditsAvailable,
      progress_to_credit: progressToCredit,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    /**
     * ERROR HANDLING
     * 
     * Common Error Scenarios:
     * - Missing STRIPE_SECRET_KEY: Edge function misconfigured
     * - Missing Authorization header: Frontend didn't send JWT
     * - Invalid JWT token: Token expired or malformed
     * - User not authenticated: Token valid but user doesn't exist
     * - Stripe API errors: Network issues, rate limits, invalid customer
     * - Database errors: Connection issues, query failures
     * 
     * All errors return 500 status with error message
     * Frontend should handle by:
     * - Assuming subscription is inactive
     * - Showing error toast
     * - Retrying after delay (for transient errors)
     */
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
