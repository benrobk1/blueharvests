-- Add address_line_2 field for apartment, suite, unit numbers etc.
ALTER TABLE public.profiles 
ADD COLUMN address_line_2 text;

-- Add comment to document the field
COMMENT ON COLUMN public.profiles.address_line_2 IS 'Apartment, suite, unit, or building number';