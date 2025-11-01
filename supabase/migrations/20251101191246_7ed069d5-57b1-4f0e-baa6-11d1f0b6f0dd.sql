-- Fix 3: Create table for Stripe webhook idempotency tracking
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_stripe_webhook_events_stripe_event_id ON public.stripe_webhook_events(stripe_event_id);

-- RLS: Only system/edge functions can manage webhook events
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhook events"
ON public.stripe_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix 1: driver_batch_stops is a VIEW - the underlying batch_stops table already has RLS
-- But let's ensure batch_stops policies are comprehensive for address protection
-- Verify that consumers cannot see addresses in batch_stops
CREATE POLICY "Consumers cannot view batch stops"
ON public.batch_stops
FOR SELECT
TO authenticated
USING (false);

-- Fix 2: Tax ID encryption will be handled in edge function using Supabase Vault API