import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface NotificationRequest {
  event_type: 'order_confirmation' | 'order_locked' | 'batch_assigned_driver' | 'batch_assigned_farmer' | 'cutoff_reminder';
  recipient_id: string;
  recipient_email?: string;
  data: {
    order_id?: string;
    batch_id?: string;
    delivery_date?: string;
    total_amount?: number;
    credits_used?: number;
    batch_number?: number;
    order_count?: number;
    stop_count?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_type, recipient_id, recipient_email, data }: NotificationRequest = await req.json();

    console.log('Sending notification:', { event_type, recipient_id });

    // Get recipient email if not provided
    let toEmail = recipient_email;
    if (!toEmail) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('id', recipient_id)
        .single();
      
      toEmail = profile?.email;
    }

    if (!toEmail) {
      console.error('No email found for recipient:', recipient_id);
      return new Response(JSON.stringify({ error: 'No email found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = '';
    let html = '';

    // Generate email based on event type
    switch (event_type) {
      case 'order_confirmation':
        subject = 'Order Confirmed - Blue Harvests';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Thank You for Your Order!</h1>
            <p>Your order has been confirmed and will be delivered on <strong>${data.delivery_date}</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Order Summary</h2>
              <p><strong>Order ID:</strong> ${data.order_id?.substring(0, 8)}</p>
              <p><strong>Delivery Date:</strong> ${data.delivery_date}</p>
              <p><strong>Total Amount:</strong> $${data.total_amount?.toFixed(2)}</p>
              ${data.credits_used ? `<p><strong>Credits Used:</strong> $${data.credits_used.toFixed(2)}</p>` : ''}
            </div>
            <p style="color: #f59e0b; font-weight: bold;">⏰ Orders lock at midnight the day before delivery</p>
            <p>You can track your order status in your account dashboard.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Thank you for supporting local farms!<br>
              Blue Harvests Team
            </p>
          </div>
        `;
        break;

      case 'order_locked':
        subject = 'Your Order is Being Prepared - Blue Harvests';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Your Order is Locked and Being Prepared!</h1>
            <p>Your order has been confirmed and assigned to a delivery batch.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Order ID:</strong> ${data.order_id?.substring(0, 8)}</p>
              <p><strong>Delivery Date:</strong> ${data.delivery_date}</p>
            </div>
            <p>Your order cannot be modified at this point. Local farmers are preparing your fresh produce!</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Blue Harvests Team
            </p>
          </div>
        `;
        break;

      case 'batch_assigned_driver':
        subject = 'New Delivery Batch Assigned - Blue Harvests';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Delivery Batch Assigned</h1>
            <p>You have been assigned a new delivery batch.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Batch Number:</strong> #${data.batch_number}</p>
              <p><strong>Delivery Date:</strong> ${data.delivery_date}</p>
              <p><strong>Number of Stops:</strong> ${data.stop_count}</p>
            </div>
            <p>Please log in to your driver dashboard to view the full route details.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Blue Harvests Team
            </p>
          </div>
        `;
        break;

      case 'batch_assigned_farmer':
        subject = 'Delivery Batch Created - Blue Harvests';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Delivery Batch for Collection Point</h1>
            <p>A new delivery batch has been created for your collection point.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Batch Number:</strong> #${data.batch_number}</p>
              <p><strong>Delivery Date:</strong> ${data.delivery_date}</p>
              <p><strong>Number of Orders:</strong> ${data.order_count}</p>
            </div>
            <p style="color: #f59e0b; font-weight: bold;">📦 Please ensure all products are delivered to the collection point between 1-3 PM</p>
            <p>Log in to your dashboard to view the complete product list.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Blue Harvests Team
            </p>
          </div>
        `;
        break;

      case 'cutoff_reminder':
        subject = 'Reminder: Order Cutoff at Midnight - Blue Harvests';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">⏰ Order Cutoff Reminder</h1>
            <p>This is a reminder that orders for tomorrow's delivery will be locked at <strong>midnight tonight</strong>.</p>
            <p>If you have items in your cart or want to make changes to your pending order, please do so before the cutoff time.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;">Orders cannot be modified after midnight. Make sure to complete your checkout!</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              Blue Harvests Team
            </p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Blue Harvests <onboarding@resend.dev>",
      to: [toEmail],
      subject,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      response: emailResponse
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Notification error:', error);
    return new Response(JSON.stringify({ 
      error: 'NOTIFICATION_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
