import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cutoff reminder job...');

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Find all consumers with pending orders for tomorrow
    const { data: pendingOrders } = await supabaseClient
      .from('orders')
      .select('consumer_id, profiles (email)')
      .eq('delivery_date', tomorrowDate)
      .eq('status', 'pending');

    // Find consumers with items in cart (who haven't checked out yet)
    const { data: cartsWithItems } = await supabaseClient
      .from('cart_items')
      .select(`
        cart_id,
        shopping_carts (
          consumer_id,
          profiles (email)
        )
      `);

    // Combine and deduplicate consumers
    const consumersToNotify = new Set<string>();
    const consumerEmails = new Map<string, string>();

    if (pendingOrders) {
      for (const order of pendingOrders) {
        const profile = order.profiles as any;
        if (profile?.email) {
          consumersToNotify.add(order.consumer_id);
          consumerEmails.set(order.consumer_id, profile.email);
        }
      }
    }

    if (cartsWithItems) {
      for (const item of cartsWithItems) {
        const cart = item.shopping_carts as any;
        const profile = cart?.profiles as any;
        if (cart?.consumer_id && profile?.email) {
          consumersToNotify.add(cart.consumer_id);
          consumerEmails.set(cart.consumer_id, profile.email);
        }
      }
    }

    console.log(`Found ${consumersToNotify.size} consumers to notify`);

    const results = {
      success: true,
      reminders_sent: 0,
      errors: [] as any[]
    };

    // Send reminder to each consumer
    for (const consumerId of consumersToNotify) {
      try {
        await supabaseClient.functions.invoke('send-notification', {
          body: {
            event_type: 'cutoff_reminder',
            recipient_id: consumerId,
            recipient_email: consumerEmails.get(consumerId),
            data: {
              delivery_date: tomorrowDate
            }
          }
        });

        results.reminders_sent++;
      } catch (error: any) {
        console.error('Failed to send reminder to consumer:', consumerId, error);
        results.errors.push({
          consumer_id: consumerId,
          error: error.message
        });
      }
    }

    console.log('Cutoff reminder job complete:', results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Cutoff reminder error:', error);
    return new Response(JSON.stringify({ 
      error: 'SERVER_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
