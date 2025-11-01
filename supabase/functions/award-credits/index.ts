import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { withAdminAuth } from '../_shared/middleware/withAdminAuth.ts';
import { getCorsHeaders, validateOrigin } from '../_shared/middleware/withCORS.ts';

// Input validation schema
const AwardCreditsSchema = z.object({
  consumer_id: z.string().uuid({ message: "Invalid consumer ID format" }),
  amount: z.number().positive({ message: "Amount must be positive" }).max(1000, { message: "Amount cannot exceed $1000" }),
  description: z.string().min(1, { message: "Description is required" }).max(500, { message: "Description must be less than 500 characters" }),
  transaction_type: z.enum(['earned', 'bonus', 'refund']).optional(),
  expires_in_days: z.number().int().positive().max(365, { message: "Expiration cannot exceed 365 days" }).optional()
});

type AwardCreditsRequest = z.infer<typeof AwardCreditsSchema>;

serve(async (req) => {
  // Handle CORS preflight
  const origin = validateOrigin(req);
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Apply admin auth middleware
    const adminAuthHandler = withAdminAuth(async (req, ctx) => {
      console.log(`[AWARD_CREDITS] Admin user ${ctx.user.id} awarding credits`);

      // Parse and validate input
      let validatedInput: AwardCreditsRequest;
      try {
        const body = await req.json();
        validatedInput = AwardCreditsSchema.parse(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(JSON.stringify({
            error: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.errors
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }

      const { 
        consumer_id, 
        amount, 
        description, 
        transaction_type = 'earned',
        expires_in_days = 90 
      } = validatedInput;

      console.log('Awarding credits:', { consumer_id, amount, description, transaction_type, admin: ctx.user.id });

      // Get current credit balance
      const { data: latestCredit } = await supabaseClient
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
      const { data: creditRecord, error: creditError } = await supabaseClient
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
        console.error('Failed to award credits:', creditError);
        throw creditError;
      }

      console.log('Credits awarded successfully:', creditRecord.id);

      // Send notification to user
      try {
        await supabaseClient.functions.invoke('send-notification', {
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
        console.error('Notification failed (non-blocking):', notifError);
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
    });
    
    // Execute with admin auth check
    return await adminAuthHandler(req, { supabase: supabaseClient });

  } catch (error: any) {
    console.error('Award credits error:', error);
    return new Response(JSON.stringify({ 
      error: 'SERVER_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
