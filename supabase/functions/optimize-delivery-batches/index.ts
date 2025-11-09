import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { checkRateLimit } from '../_shared/rateLimiter.ts';
import { OptimizeBatchesRequestSchema } from '../_shared/contracts/optimization.ts';
import { BatchOptimizationService } from '../_shared/services/BatchOptimizationService.ts';

/**
 * OPTIMIZE DELIVERY BATCHES EDGE FUNCTION
 * 
 * AI-powered batch optimization with geographic fallback.
 * Uses BatchOptimizationService for dual-path optimization.
 * Full middleware: RequestId + AdminAuth + RateLimit + Validation + ErrorHandling
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [OPTIMIZE-BATCHES] Request started`);

  try {
    const config = loadConfig();
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.warn(`[${requestId}] ⚠️  LOVABLE_API_KEY not configured - will use fallback batching`);
    }

    // Authenticate admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED', code: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role
    const { data: hasAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required', code: 'UNAUTHORIZED' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[${requestId}] Admin user ${user.id} authorized`);

    // Rate limiting
    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.OPTIMIZE_BATCHES);
    if (!rateCheck.allowed) {
      console.warn(`[${requestId}] ⚠️ Rate limit exceeded for user ${user.id}`);
      return new Response(JSON.stringify({ 
        error: 'TOO_MANY_REQUESTS', 
        message: 'Too many requests. Please try again later.',
        retryAfter: rateCheck.retryAfter,
      }), {
        status: 429,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateCheck.retryAfter || 60),
        }
      });
    }

    // Validate input
    const body = await req.json();
    const validationResult = OptimizeBatchesRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: validationResult.error.flatten(),
        code: 'VALIDATION_ERROR',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { delivery_date } = validationResult.data;

    console.log(`[${requestId}] Optimizing batches for delivery date: ${delivery_date}`);

    // Initialize optimization service
    const service = new BatchOptimizationService(supabase, lovableApiKey);
    const result = await service.optimizeBatches(delivery_date);

    console.log(`[${requestId}] ✅ Created ${result.batches_created} batches for ${result.total_orders} orders`);
    console.log(`[${requestId}] Optimization method: ${result.optimization_method}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`[${requestId}] ❌ Optimize batches error:`, error);
    return new Response(JSON.stringify({ 
      error: 'SERVER_ERROR',
      message: error.message,
      code: 'OPTIMIZATION_FAILED'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
