-- Create secure view for driver batch stops that masks addresses
CREATE OR REPLACE VIEW driver_batch_stops_secure AS
SELECT
  id,
  delivery_batch_id,
  order_id,
  sequence_number,
  -- CRITICAL: Mask address until visible
  CASE
    WHEN address_visible_at IS NOT NULL AND now() >= address_visible_at
    THEN address
    ELSE '[Address hidden until delivery]'
  END AS address,
  CASE
    WHEN address_visible_at IS NOT NULL AND now() >= address_visible_at
    THEN street_address
    ELSE NULL
  END AS street_address,
  -- Mask city/state/zip until visible
  CASE
    WHEN address_visible_at IS NOT NULL AND now() >= address_visible_at
    THEN city
    ELSE NULL
  END AS city,
  CASE
    WHEN address_visible_at IS NOT NULL AND now() >= address_visible_at
    THEN state
    ELSE NULL
  END AS state,
  CASE
    WHEN address_visible_at IS NOT NULL AND now() >= address_visible_at
    THEN zip_code
    ELSE NULL
  END AS zip_code,
  address_visible_at,
  status,
  estimated_arrival,
  actual_arrival,
  latitude,
  longitude,
  notes,
  geojson,
  created_at
FROM batch_stops
WHERE 
  -- Only show stops from batches assigned to the current user (if driver)
  EXISTS (
    SELECT 1 FROM delivery_batches
    WHERE delivery_batches.id = batch_stops.delivery_batch_id
      AND delivery_batches.driver_id = auth.uid()
  )
  -- Or if the user is an admin
  OR has_role(auth.uid(), 'admin');

-- Make view security barrier to prevent query optimization bypasses
ALTER VIEW driver_batch_stops_secure SET (security_barrier = true);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON driver_batch_stops_secure TO authenticated;

-- Comment on the view explaining its purpose
COMMENT ON VIEW driver_batch_stops_secure IS 'Security view that masks consumer addresses from drivers until address_visible_at timestamp. Prevents premature address exposure at database level. RLS filtering built into view definition.';