import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { AwardCreditsRequestSchema } from '../_shared/contracts/credits.ts';
import {
  withRequestId,
  withCORS,
  withAuth,
  withAdminAuth,
  withRateLimit,
  withValidation,
  withErrorHandling,
  withMetrics,
  createMiddlewareStack,
} from '../_shared/middleware/index.ts';

/**
 * AWARD CREDITS EDGE FUNCTION
 * 
 * Admin-only function to award credits to consumers.
 * Supports earned, bonus, and refund transaction types.
 * Full middleware: RequestId + Metrics + CORS + Auth + AdminAuth + RateLimit + Validation + ErrorHandling
 */

type AwardCreditsContext = {
  requestId: string;
  corsHeaders: Record<string, string>;
  user: any;
  supabase: any;
  metrics: any;
  input: any;
};

const handler = async (req: Request, ctx: AwardCreditsContext) => {
  const { requestId, corsHeaders, supabase, metrics, input } = ctx;

  const { 
    consumer_id, 
    amount, 
    description, 
    transaction_type = 'earned',
    expires_in_days = 90 
  } = input;

  console.log(`[${requestId}] Awarding credits:`, { 
    consumer_id, 
    amount, 
    description, 
    transaction_type 
  });

    // Get current credit balance
    const { data: latestCredit } = await supabase
      .from('credits_ledger')
      .select('balance_after')
      .eq('consumer_id', consumer_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentBalance = latestCredit?.balance_after || 0;
    const newBalance = currentBalance + amount;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    // Insert credit transaction
    const { data: creditRecord, error: creditError } = await supabase
      .from('credits_ledger')
      .insert({
        consumer_id,
        transaction_type,
        amount,
        balance_after: newBalance,
        description,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (creditError) {
      console.error(`[${requestId}] ❌ Failed to award credits:`, creditError);
      throw new Error(`Credit award failed: ${creditError.message}`);
    }

    metrics.mark('credits_awarded');
    console.log(`[${requestId}] ✅ Credits awarded successfully:`, creditRecord.id);

    // Send notification to user (non-blocking)
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          event_type: 'credits_awarded',
          recipient_id: consumer_id,
          data: {
            amount,
            new_balance: newBalance,
            description,
            expires_at: expiresAt.toISOString()
          }
        }
      });
    } catch (notifError) {
      console.error(`[${requestId}] Notification failed (non-blocking):`, notifError);
    }

  return new Response(JSON.stringify({
    success: true,
    credit_id: creditRecord.id,
    amount_awarded: amount,
    new_balance: newBalance,
    expires_at: expiresAt.toISOString()
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

// Compose middleware manually
const composed = withErrorHandling(
  withRequestId(
    withMetrics('award-credits')(
      withCORS(
        withAuth(
          withAdminAuth(
            withRateLimit(RATE_LIMITS.AWARD_CREDITS)(
              withValidation(AwardCreditsRequestSchema)(handler)
            )
          )
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
