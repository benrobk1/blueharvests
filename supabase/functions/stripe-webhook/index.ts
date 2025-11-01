/**
 * STRIPE WEBHOOK HANDLER (POST-DEMO IMPLEMENTATION)
 * 
 * Handles Stripe webhook events for payment and subscription state sync.
 * 
 * SUPPORTED EVENTS (TODOs for post-demo):
 * - payment_intent.succeeded → Update order status to 'paid'
 * - payment_intent.payment_failed → Mark order as 'failed', notify consumer
 * - customer.subscription.updated → Sync subscription status in database
 * - customer.subscription.deleted → Disable credits eligibility, notify consumer
 * - charge.dispute.created → Notify admin, flag order for review
 * - payout.failed → Retry payout logic, alert finance team
 * 
 * SECURITY:
 * - Verifies webhook signature using STRIPE_WEBHOOK_SECRET
 * - Rejects unsigned/invalid requests with 400 error
 * - Public endpoint (no JWT verification needed)
 * 
 * WHY THIS MATTERS FOR YC DEMO:
 * - Shows production-readiness thinking
 * - Webhook signature verification is critical security
 * - TODOs demonstrate edge cases have been considered
 * - Ready to implement post-demo with minimal code changes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@18.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [STRIPE_WEBHOOK] Received webhook request`);

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey) {
      console.error(`[${requestId}] [STRIPE_WEBHOOK] ❌ STRIPE_SECRET_KEY not configured`);
      return new Response('Stripe secret key not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    if (!webhookSecret) {
      console.error(`[${requestId}] [STRIPE_WEBHOOK] ❌ STRIPE_WEBHOOK_SECRET not configured`);
      return new Response('Webhook secret not configured', { 
        status: 500,
        headers: corsHeaders 
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error(`[${requestId}] [STRIPE_WEBHOOK] ❌ Missing stripe-signature header`);
      return new Response('Missing signature', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`[${requestId}] [STRIPE_WEBHOOK] ✅ Signature verified: ${event.type}`);
    } catch (err: any) {
      console.error(`[${requestId}] [STRIPE_WEBHOOK] ❌ Signature verification failed: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Payment succeeded: ${paymentIntent.id}`);
        
        // TODO: Update order status to 'paid'
        // TODO: Send order confirmation email
        // TODO: Award credits if applicable (1 credit per $100 spent)
        
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Payment failed: ${paymentIntent.id}`);
        
        // TODO: Mark order as 'failed' in database
        // TODO: Send notification to consumer with retry instructions
        // TODO: Log failure reason for admin review
        
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Subscription updated: ${subscription.id}`);
        
        // TODO: Sync subscription status in database
        // TODO: Update credits eligibility based on status
        // TODO: If canceled, send cancellation confirmation email
        
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Subscription deleted: ${subscription.id}`);
        
        // TODO: Disable credits earning (but allow redemption of existing)
        // TODO: Send notification about subscription end
        // TODO: Offer resubscribe incentive (e.g., bonus credits)
        
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Dispute created: ${dispute.id}`);
        
        // TODO: Notify admin team immediately
        // TODO: Flag order for manual review
        // TODO: Create dispute record in database
        // TODO: Pause related payouts until resolved
        
        break;
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        console.log(`[${requestId}] [STRIPE_WEBHOOK] Payout failed: ${payout.id}`);
        
        // TODO: Mark payout as 'failed' in database
        // TODO: Retry payout logic (with exponential backoff)
        // TODO: Alert finance team if retries exhausted
        // TODO: Notify recipient of payout delay
        
        break;
      }

      default:
        console.log(`[${requestId}] [STRIPE_WEBHOOK] ⚠️  Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: event.type }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error(`[${requestId}] [STRIPE_WEBHOOK] ❌ Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
