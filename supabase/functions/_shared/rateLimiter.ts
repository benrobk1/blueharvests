import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `${config.keyPrefix}:${userId}`;

  // Get recent requests from rate_limits table
  const { data: recentRequests, error } = await supabaseAdmin
    .from('rate_limits')
    .select('created_at')
    .eq('key', key)
    .gte('created_at', new Date(windowStart).toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true }; // Fail open on errors
  }

  const requestCount = recentRequests?.length || 0;

  if (requestCount >= config.maxRequests) {
    const oldestRequest = new Date(recentRequests[0].created_at).getTime();
    const retryAfter = Math.ceil((oldestRequest + config.windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Log this request
  await supabaseAdmin
    .from('rate_limits')
    .insert({ key, created_at: new Date().toISOString() });

  // Clean up old entries for this key
  await supabaseAdmin
    .from('rate_limits')
    .delete()
    .eq('key', key)
    .lt('created_at', new Date(windowStart).toISOString());

  return { allowed: true };
}
