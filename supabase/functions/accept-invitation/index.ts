import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { loadConfig } from '../_shared/config.ts';
import { 
  withRequestId, 
  withCORS, 
  withValidation,
  withErrorHandling, 
  createMiddlewareStack,
  type RequestIdContext,
  type CORSContext,
  type ValidationContext
} from '../_shared/middleware/index.ts';

/**
 * ACCEPT INVITATION EDGE FUNCTION
 * 
 * Public endpoint for accepting admin invitations and creating accounts.
 * Uses middleware pattern with validation (no authentication required).
 */

// Validation schema
const AcceptInvitationRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
});

type AcceptInvitationRequest = z.infer<typeof AcceptInvitationRequestSchema>;

type Context = RequestIdContext & CORSContext & ValidationContext<AcceptInvitationRequest>;

/**
 * Main handler with middleware composition
 */
const handler = async (req: Request, ctx: Context): Promise<Response> => {
  const { token, password, fullName } = ctx.input;
  
  console.log(`[${ctx.requestId}] [ACCEPT-INVITATION] Processing token: ${token.substring(0, 8)}...`);

  const config = loadConfig();
  const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

    // Fetch and validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("admin_invitations")
      .select("*")
      .eq("invitation_token", token)
      .is("used_at", null)
      .single();

  if (invitationError || !invitation) {
    console.error(`[${ctx.requestId}] [ACCEPT-INVITATION] Invalid token:`, invitationError);
    return new Response(
      JSON.stringify({ error: "Invalid or expired invitation" }),
      {
        status: 400,
        headers: { ...ctx.corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Check expiration
  if (new Date(invitation.expires_at) < new Date()) {
    console.error(`[${ctx.requestId}] [ACCEPT-INVITATION] Token expired`);
    return new Response(
      JSON.stringify({ error: "This invitation has expired" }),
      {
        status: 400,
        headers: { ...ctx.corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(`[${ctx.requestId}] [ACCEPT-INVITATION] Creating user for ${invitation.email}`);

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
    console.error(`[${ctx.requestId}] [ACCEPT-INVITATION] Error creating user:`, authError);
    throw new Error(authError?.message || "Failed to create user account");
  }

  console.log(`[${ctx.requestId}] [ACCEPT-INVITATION] User created: ${authData.user.id}`);

  // Assign admin role
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert({
      user_id: authData.user.id,
      role: "admin",
    });

  if (roleError) {
    console.error(`[${ctx.requestId}] [ACCEPT-INVITATION] Error assigning role:`, roleError);
    // Clean up - delete the user if role assignment fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error("Failed to assign admin role");
  }

  console.log(`[${ctx.requestId}] [ACCEPT-INVITATION] Admin role assigned`);

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

  console.log(`[${ctx.requestId}] [ACCEPT-INVITATION] ✅ Success for ${invitation.email}`);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Account created successfully. You can now log in.",
      email: invitation.email,
    }),
    {
      status: 200,
      headers: { ...ctx.corsHeaders, "Content-Type": "application/json" },
    }
  );
};

// Compose middleware stack (public endpoint, no auth needed)
const middlewareStack = createMiddlewareStack<Context>([
  withRequestId,
  withCORS,
  withValidation(AcceptInvitationRequestSchema),
  withErrorHandling
]);

serve((req) => middlewareStack(handler)(req, {} as any));
