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

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'FORBIDDEN - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🗑️ Resetting demo data...');

    // Delete demo users and their associated data
    // The cascade will handle related records
    const { data: demoProfiles } = await supabaseClient
      .from('profiles')
      .select('id')
      .ilike('email', '%@demo.com');

    if (demoProfiles && demoProfiles.length > 0) {
      const demoIds = demoProfiles.map(p => p.id);
      
      // Delete users (this will cascade to most tables)
      for (const userId of demoIds) {
        await supabaseClient.auth.admin.deleteUser(userId);
      }
      
      console.log(`Deleted ${demoIds.length} demo users`);
    }

    // Clean up any orphaned records
    await supabaseClient
      .from('market_configs')
      .delete()
      .eq('zip_code', '10001');

    console.log('✅ Demo data reset complete');

    return new Response(JSON.stringify({
      success: true,
      message: 'Demo data reset successfully',
      deleted_users: demoProfiles?.length || 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Reset demo data error:', error);
    return new Response(JSON.stringify({ 
      error: 'SERVER_ERROR',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
