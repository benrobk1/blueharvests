-- Drop existing constraints if they exist
ALTER TABLE products DROP CONSTRAINT IF EXISTS positive_price;
ALTER TABLE products DROP CONSTRAINT IF EXISTS non_negative_quantity;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS positive_quantity;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS positive_unit_price;

-- Add constraints for data integrity
ALTER TABLE products 
  ADD CONSTRAINT positive_price CHECK (price >= 0),
  ADD CONSTRAINT non_negative_quantity CHECK (available_quantity >= 0);

ALTER TABLE order_items
  ADD CONSTRAINT positive_quantity CHECK (quantity > 0),
  ADD CONSTRAINT positive_unit_price CHECK (unit_price >= 0);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_consumer_status ON orders(consumer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON orders(delivery_batch_id);
CREATE INDEX IF NOT EXISTS idx_products_farm_active ON products(farm_profile_id, available_quantity) 
  WHERE available_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_batch_stops_batch_sequence ON batch_stops(delivery_batch_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_credits_consumer_date ON credits_ledger(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron jobs if they exist
SELECT cron.unschedule('generate-daily-batches') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-batches'
);

SELECT cron.unschedule('send-cutoff-reminders') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-cutoff-reminders'
);

-- Schedule batch generation cron job (daily at 11:59 PM)
SELECT cron.schedule(
  'generate-daily-batches',
  '59 23 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xushmvtkfkijrhfoxhat.supabase.co/functions/v1/generate-batches',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase.service_role_key', true) || '"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);

-- Schedule cutoff reminder cron job (daily at 6:00 PM)
SELECT cron.schedule(
  'send-cutoff-reminders',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xushmvtkfkijrhfoxhat.supabase.co/functions/v1/send-cutoff-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('supabase.service_role_key', true) || '"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);