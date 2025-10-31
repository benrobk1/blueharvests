-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Anyone can view product images
CREATE POLICY "Public product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- RLS: Farmers can upload product images to their farm folder
CREATE POLICY "Farmers upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IN (
    SELECT farmer_id FROM farm_profiles 
    WHERE id::text = (storage.foldername(name))[1]
  )
);

-- Add tax information fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tax_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS tax_id_type TEXT CHECK (tax_id_type IN ('ssn', 'ein')),
ADD COLUMN IF NOT EXISTS tax_name TEXT,
ADD COLUMN IF NOT EXISTS tax_address TEXT,
ADD COLUMN IF NOT EXISTS w9_submitted_at TIMESTAMP WITH TIME ZONE;

-- Create farm_affiliations junction table
CREATE TABLE IF NOT EXISTS farm_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farm_profile_id UUID NOT NULL REFERENCES farm_profiles(id) ON DELETE CASCADE,
  commission_rate NUMERIC DEFAULT 5.0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lead_farmer_id, farm_profile_id)
);

-- Enable RLS on farm_affiliations
ALTER TABLE farm_affiliations ENABLE ROW LEVEL SECURITY;

-- RLS: Lead farmers can view their affiliations
CREATE POLICY "Lead farmers view affiliations" ON farm_affiliations
FOR SELECT USING (auth.uid() = lead_farmer_id);

-- RLS: Admins can manage affiliations
CREATE POLICY "Admins manage affiliations" ON farm_affiliations
FOR ALL USING (has_role(auth.uid(), 'admin'));