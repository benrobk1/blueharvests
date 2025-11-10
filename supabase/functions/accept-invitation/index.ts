import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
  fullName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [ACCEPT-INVITATION] Request started`);

  try {
    const { token, password, fullName }: AcceptInvitationRequest = await req.json();

    // Validate inputs
    if (!token || !password || !fullName) {
      throw new Error("Missing required fields");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    console.log(`[${requestId}] [ACCEPT-INVITATION] Processing token: ${token.substring(0, 8)}...`);

    // Use service role to create user and manage invitation
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch and validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("admin_invitations")
      .select("*")
      .eq("invitation_token", token)
      .is("used_at", null)
      .single();

    if (invitationError || !invitation) {
      console.error(`[${requestId}] [ACCEPT-INVITATION] Invalid token:`, invitationError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check expiration
    if (new Date(invitation.expires_at) < new Date()) {
      console.error(`[${requestId}] [ACCEPT-INVITATION] Token expired`);
      return new Response(
        JSON.stringify({ error: "This invitation has expired" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[${requestId}] [ACCEPT-INVITATION] Creating user for ${invitation.email}`);

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.error(`[${requestId}] [ACCEPT-INVITATION] Error creating user:`, authError);
      throw new Error(authError?.message || "Failed to create user account");
    }

    console.log(`[${requestId}] [ACCEPT-INVITATION] User created: ${authData.user.id}`);

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role: "admin",
      });

    if (roleError) {
      console.error(`[${requestId}] [ACCEPT-INVITATION] Error assigning role:`, roleError);
      // Clean up - delete the user if role assignment fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error("Failed to assign admin role");
    }

    console.log(`[${requestId}] [ACCEPT-INVITATION] Admin role assigned`);

    // Mark invitation as used
    await supabase
      .from("admin_invitations")
      .update({ used_at: new Date().toISOString() })
      .eq("invitation_token", token);

    // Log admin action (attributed to the inviter)
    if (invitation.invited_by) {
      await supabase.rpc("log_admin_action", {
        _action_type: "admin_invitation_accepted",
        _target_user_id: authData.user.id,
        _new_value: { email: invitation.email, full_name: fullName },
      });
    }

    console.log(`[${requestId}] [ACCEPT-INVITATION] ✅ Success for ${invitation.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully. You can now log in.",
        email: invitation.email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error(`[${requestId}] [ACCEPT-INVITATION] ❌ Error:`, error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to accept invitation" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
