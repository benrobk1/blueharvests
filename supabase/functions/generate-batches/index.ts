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

    console.log('Starting batch generation...');

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log('Processing orders for delivery date:', tomorrowDate);

    // 1. Find all pending orders for tomorrow
    const { data: pendingOrders, error: ordersError } = await supabaseClient
      .from('orders')
      .select(`
        id,
        consumer_id,
        total_amount,
        profiles (
          zip_code,
          delivery_address,
          full_name
        )
      `)
      .eq('delivery_date', tomorrowDate)
      .eq('status', 'pending')
      .is('delivery_batch_id', null);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log('No pending orders found for tomorrow');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending orders to process',
        batches_created: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingOrders.length} pending orders`);

    // 2. Group orders by ZIP code
    const ordersByZip: { [key: string]: any[] } = {};
    
    for (const order of pendingOrders) {
      const profile = order.profiles as any;
      const zipCode = profile?.zip_code || 'unknown';
      
      if (!ordersByZip[zipCode]) {
        ordersByZip[zipCode] = [];
      }
      ordersByZip[zipCode].push(order);
    }

    console.log(`Orders grouped into ${Object.keys(ordersByZip).length} ZIP code zones`);

    const batchesCreated = [];
    const errors = [];

    // 3. Create delivery batch for each ZIP zone
    for (const [zipCode, orders] of Object.entries(ordersByZip)) {
      try {
        console.log(`Creating batch for ZIP ${zipCode} with ${orders.length} orders`);

        // Get lead farmer for this ZIP (if configured)
        const { data: marketConfig } = await supabaseClient
          .from('market_configs')
          .select('id')
          .eq('zip_code', zipCode)
          .eq('active', true)
          .single();

        // Get next batch number for this date
        const { data: existingBatches } = await supabaseClient
          .from('delivery_batches')
          .select('batch_number')
          .eq('delivery_date', tomorrowDate)
          .order('batch_number', { ascending: false })
          .limit(1);

        const nextBatchNumber = existingBatches && existingBatches.length > 0 
          ? existingBatches[0].batch_number + 1 
          : 1;

        // Create delivery batch
        const { data: batch, error: batchError } = await supabaseClient
          .from('delivery_batches')
          .insert({
            delivery_date: tomorrowDate,
            batch_number: nextBatchNumber,
            zip_codes: [zipCode],
            status: 'pending',
            lead_farmer_id: null // Will be assigned later by admin
          })
          .select()
          .single();

        if (batchError || !batch) {
          console.error('Batch creation error:', batchError);
          errors.push({ zipCode, error: batchError?.message });
          continue;
        }

        console.log(`Batch ${batch.id} created with number ${nextBatchNumber}`);

        // 4. Create batch stops for each order
        let sequenceNumber = 1;
        for (const order of orders) {
          const profile = order.profiles as any;

          const { error: stopError } = await supabaseClient
            .from('batch_stops')
            .insert({
              delivery_batch_id: batch.id,
              order_id: order.id,
              address: profile?.delivery_address || 'Address not provided',
              sequence_number: sequenceNumber++,
              status: 'pending',
              latitude: null,
              longitude: null,
              estimated_arrival: null
            });

          if (stopError) {
            console.error('Batch stop creation error:', stopError);
            errors.push({ order_id: order.id, error: stopError.message });
          }
        }

        // 5. Update orders to confirmed status and link to batch
        const orderIds = orders.map(o => o.id);
        const { error: updateError } = await supabaseClient
          .from('orders')
          .update({
            status: 'confirmed',
            delivery_batch_id: batch.id
          })
          .in('id', orderIds);

        if (updateError) {
          console.error('Order update error:', updateError);
          errors.push({ batch_id: batch.id, error: updateError.message });
        }

        batchesCreated.push({
          batch_id: batch.id,
          batch_number: nextBatchNumber,
          zip_code: zipCode,
          order_count: orders.length
        });

        // 6. Send notifications for locked orders
        for (const order of orders) {
          try {
            await supabaseClient.functions.invoke('send-notification', {
              body: {
                event_type: 'order_locked',
                recipient_id: order.consumer_id,
                data: {
                  order_id: order.id,
                  batch_id: batch.id,
                  delivery_date: tomorrowDate
                }
              }
            });
          } catch (notifError) {
            console.error('Notification error (non-blocking):', notifError);
          }
        }

        console.log(`Batch ${batch.id} completed with ${orders.length} stops`);

      } catch (error: any) {
        console.error(`Error processing ZIP ${zipCode}:`, error);
        errors.push({ zipCode, error: error.message });
      }
    }

    const response = {
      success: true,
      delivery_date: tomorrowDate,
      batches_created: batchesCreated.length,
      total_orders_processed: pendingOrders.length,
      batches: batchesCreated,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('Batch generation complete:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Batch generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'SERVER_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
