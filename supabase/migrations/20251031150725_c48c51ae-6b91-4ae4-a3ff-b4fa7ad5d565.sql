-- Fix Security Warnings (excluding view)

-- 1. Enable RLS on rate_limits table (system-only access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system can manage rate limits"
ON public.rate_limits
FOR ALL
USING (false);

-- 2. Restrict market_configs policy to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active market configs" ON public.market_configs;

CREATE POLICY "Authenticated users can view active market configs"
ON public.market_configs
FOR SELECT
TO authenticated
USING (active = true);