-- Add indexes for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id_created_at ON public.orders(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date_status ON public.orders(delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_driver_id_status ON public.delivery_batches(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_date_status ON public.delivery_batches(delivery_date, status);
CREATE INDEX IF NOT EXISTS idx_batch_stops_batch_status ON public.batch_stops(delivery_batch_id, status);
CREATE INDEX IF NOT EXISTS idx_products_farm_available ON public.products(farm_profile_id, available_quantity);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_payouts_recipient_status ON public.payouts(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_intents_consumer_status ON public.payment_intents(consumer_id, status);

-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  consumer_id uuid NOT NULL REFERENCES auth.users(id),
  dispute_type text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  refund_amount numeric,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dispute_type_check CHECK (dispute_type IN ('product_quality', 'missing_items', 'wrong_items', 'delivery_issue', 'other')),
  CONSTRAINT dispute_status_check CHECK (status IN ('open', 'investigating', 'resolved', 'rejected'))
);

-- Enable RLS on disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for disputes
CREATE POLICY "Users can view own disputes"
ON public.disputes FOR SELECT
USING (auth.uid() = consumer_id);

CREATE POLICY "Admins can view all disputes"
ON public.disputes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can create disputes"
ON public.disputes FOR INSERT
WITH CHECK (auth.uid() = consumer_id);

CREATE POLICY "Admins can update disputes"
ON public.disputes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_disputes_updated_at
BEFORE UPDATE ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_consumer_id ON public.disputes(consumer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);