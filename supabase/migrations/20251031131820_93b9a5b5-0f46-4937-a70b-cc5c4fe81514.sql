-- Update farm_affiliations commission rate from 5% to 2%
-- This reflects the correct revenue split: 88% farmer, 2% lead farmer, 10% platform

-- Update default commission rate
ALTER TABLE farm_affiliations 
ALTER COLUMN commission_rate SET DEFAULT 2.0;

-- Update existing affiliations to 2% if they're still at 5%
UPDATE farm_affiliations 
SET commission_rate = 2.0 
WHERE commission_rate = 5.0;

-- Add comment explaining business rule
COMMENT ON TABLE farm_affiliations IS 
'All regular farmers MUST be affiliated with a lead farmer. Default commission: 2%';

-- Add index to speed up affiliation lookups during checkout
CREATE INDEX IF NOT EXISTS idx_farm_affiliations_farm_profile_active 
ON farm_affiliations(farm_profile_id, active) 
WHERE active = true;