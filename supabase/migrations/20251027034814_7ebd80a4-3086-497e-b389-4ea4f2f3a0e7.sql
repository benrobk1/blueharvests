-- Add bio field to farm_profiles for farmer stories
ALTER TABLE farm_profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add acquisition_channel to profiles for CAC tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS acquisition_channel text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_acquisition_channel ON profiles(acquisition_channel);
CREATE INDEX IF NOT EXISTS idx_orders_consumer_id_created_at ON orders(consumer_id, created_at DESC);