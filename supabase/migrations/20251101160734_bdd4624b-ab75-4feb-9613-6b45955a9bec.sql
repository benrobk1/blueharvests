-- Add collection_point_id to market_configs for ZIP code assignment
ALTER TABLE market_configs 
ADD COLUMN collection_point_id UUID REFERENCES profiles(id);

-- Index for performance
CREATE INDEX idx_market_configs_collection_point ON market_configs(collection_point_id);

-- Add batch configuration columns
ALTER TABLE market_configs
ADD COLUMN target_batch_size INTEGER DEFAULT 37,
ADD COLUMN min_batch_size INTEGER DEFAULT 30,
ADD COLUMN max_batch_size INTEGER DEFAULT 45,
ADD COLUMN max_route_hours NUMERIC DEFAULT 7.5;

-- Create batch_metadata table for tracking AI optimization
CREATE TABLE batch_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_batch_id UUID REFERENCES delivery_batches(id) ON DELETE CASCADE,
  collection_point_id UUID REFERENCES profiles(id),
  collection_point_address TEXT,
  original_zip_codes TEXT[],
  merged_zips TEXT[],
  order_count INTEGER NOT NULL,
  is_subsidized BOOLEAN DEFAULT false,
  ai_optimization_data JSONB,
  estimated_route_hours NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on batch_metadata
ALTER TABLE batch_metadata ENABLE ROW LEVEL SECURITY;

-- Admins can view all batch metadata
CREATE POLICY "Admins can view all batch metadata"
  ON batch_metadata
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Lead farmers can view their collection point batches
CREATE POLICY "Lead farmers can view their batch metadata"
  ON batch_metadata
  FOR SELECT
  USING (
    collection_point_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = batch_metadata.delivery_batch_id
      AND delivery_batches.lead_farmer_id = auth.uid()
    )
  );

-- Drivers can view assigned batch metadata
CREATE POLICY "Drivers can view assigned batch metadata"
  ON batch_metadata
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = batch_metadata.delivery_batch_id
      AND delivery_batches.driver_id = auth.uid()
    )
  );