-- Create delivery_ratings table for driver rating system
CREATE TABLE public.delivery_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS on delivery_ratings
ALTER TABLE public.delivery_ratings ENABLE ROW LEVEL SECURITY;

-- Consumers can create ratings for their orders
CREATE POLICY "Consumers can create ratings for own orders"
ON public.delivery_ratings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.consumer_id = auth.uid()
  )
);

-- Consumers can view ratings for their orders
CREATE POLICY "Consumers can view ratings for own orders"
ON public.delivery_ratings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.consumer_id = auth.uid()
  )
);

-- Drivers can view their ratings
CREATE POLICY "Drivers can view own ratings"
ON public.delivery_ratings
FOR SELECT
USING (auth.uid() = driver_id);

-- Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
ON public.delivery_ratings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes
CREATE INDEX idx_delivery_ratings_driver_id ON public.delivery_ratings(driver_id);
CREATE INDEX idx_delivery_ratings_order_id ON public.delivery_ratings(order_id);

-- Add box_code to orders table for box coding system
ALTER TABLE public.orders 
ADD COLUMN box_code TEXT;

-- Create index for box code lookups
CREATE INDEX idx_orders_box_code ON public.orders(box_code);

-- Function to generate box code for an order
CREATE OR REPLACE FUNCTION public.generate_box_code(
  p_batch_id UUID,
  p_stop_sequence INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_number INTEGER;
BEGIN
  -- Get batch number
  SELECT batch_number INTO v_batch_number
  FROM delivery_batches
  WHERE id = p_batch_id;
  
  -- Generate code: B{batch_number}-{stop_sequence}
  RETURN 'B' || v_batch_number || '-' || p_stop_sequence;
END;
$$;

-- Function to calculate driver average rating
CREATE OR REPLACE FUNCTION public.get_driver_rating(p_driver_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 1)
  INTO v_avg_rating
  FROM delivery_ratings
  WHERE driver_id = p_driver_id;
  
  RETURN COALESCE(v_avg_rating, 0);
END;
$$;

-- Note: commission_rate field already exists in profiles table with default 5.0
-- We just need to ensure lead farmer commission calculation in the checkout function