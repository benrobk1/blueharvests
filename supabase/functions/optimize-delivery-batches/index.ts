/**
 * BATCH OPTIMIZATION EDGE FUNCTION (REFACTORED)
 * 
 * Thin handler that delegates to BatchOptimizationService.
 * Uses dual-path optimization: AI-powered (primary) + geographic (fallback).
 * 
 * WHY THIS MATTERS FOR YC DEMO:
 * - Handler is now ~50 lines (was 433) - easy to scan and review
 * - Business logic extracted to service layer for testability
 * - Still maintains all functionality with improved architecture
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BatchOptimizationService } from '../_shared/services/BatchOptimizationService.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] [BATCH_OPT] Received batch optimization request`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables');
    }
    
    if (!lovableApiKey) {
      console.warn(`[${requestId}] [BATCH_OPT] ⚠️  LOVABLE_API_KEY not configured - will use fallback batching`);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { delivery_date } = await req.json();

    const service = new BatchOptimizationService(supabase, lovableApiKey);
    const result = await service.optimizeBatches(delivery_date);

    console.log(`[${requestId}] [BATCH_OPT] ✅ Created ${result.batches_created} batches for ${result.total_orders} orders`);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${requestId}] [BATCH_OPT] ❌ Error:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});