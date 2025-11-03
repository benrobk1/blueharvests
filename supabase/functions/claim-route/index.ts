import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Anon client to read the auth user from JWT
    const anon = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });
    // Service role client for privileged updates
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await anon.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchId: string | undefined = body.batch_id;
    if (!batchId) {
      return new Response(JSON.stringify({ error: "batch_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Confirm user has driver role
    const { data: isDriver, error: roleErr } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "driver",
    });
    if (roleErr || !isDriver) {
      return new Response(JSON.stringify({ error: "Driver role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure the batch is pending and unassigned
    const { data: batch, error: loadErr } = await admin
      .from("delivery_batches")
      .select("id, status, driver_id")
      .eq("id", batchId)
      .single();

    if (loadErr || !batch) {
      return new Response(JSON.stringify({ error: "Batch not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (batch.status !== "pending" || batch.driver_id !== null) {
      return new Response(JSON.stringify({ error: "Batch not available" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign the batch to the driver
    const { error: updateErr } = await admin
      .from("delivery_batches")
      .update({ driver_id: user.id, status: "assigned" })
      .eq("id", batchId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("claim-route error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
