-- Create saved_carts table for Save Cart feature
CREATE TABLE saved_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE saved_carts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved carts
CREATE POLICY "Users can manage own saved carts"
  ON saved_carts FOR ALL
  USING (auth.uid() = consumer_id)
  WITH CHECK (auth.uid() = consumer_id);

-- Index for performance
CREATE INDEX idx_saved_carts_consumer_id ON saved_carts(consumer_id);

-- Trigger to update updated_at
CREATE TRIGGER update_saved_carts_updated_at
  BEFORE UPDATE ON saved_carts
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();