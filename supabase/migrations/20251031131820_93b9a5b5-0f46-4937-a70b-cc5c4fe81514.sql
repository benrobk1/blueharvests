-- Update farm_affiliations commission rate from 2% back to 5%
-- This reflects the updated revenue split: 85% farmer, 5% lead farmer, 10% platform

-- Update default commission rate
ALTER TABLE farm_affiliations
ALTER COLUMN commission_rate SET DEFAULT 5.0;

-- Update existing affiliations to 5% if they're still at 2%
UPDATE farm_affiliations
SET commission_rate = 5.0
WHERE commission_rate = 2.0;

-- Add comment explaining business rule
COMMENT ON TABLE farm_affiliations IS
'All regular farmers MUST be affiliated with a lead farmer. Default commission: 5%';

-- Add index to speed up affiliation lookups during checkout
CREATE INDEX IF NOT EXISTS idx_farm_affiliations_farm_profile_active 
ON farm_affiliations(farm_profile_id, active) 
WHERE active = true;