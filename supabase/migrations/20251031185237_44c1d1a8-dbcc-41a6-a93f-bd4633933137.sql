-- Fix Security Issue: Recreate driver_batch_stops view with security_invoker=on
DROP VIEW IF EXISTS public.driver_batch_stops;

CREATE VIEW public.driver_batch_stops
WITH (security_invoker=on)
AS
SELECT id,
    delivery_batch_id,
    order_id,
    sequence_number,
    latitude,
    longitude,
    estimated_arrival,
    actual_arrival,
    created_at,
    geojson,
    status,
    notes,
    CASE
        WHEN address_visible_at IS NOT NULL THEN address
        ELSE 'Address available when delivery is near'::text
    END AS address,
    CASE
        WHEN address_visible_at IS NOT NULL THEN street_address
        ELSE NULL::text
    END AS street_address,
    CASE
        WHEN address_visible_at IS NOT NULL THEN city
        ELSE NULL::text
    END AS city,
    CASE
        WHEN address_visible_at IS NOT NULL THEN state
        ELSE NULL::text
    END AS state,
    zip_code,
    address_visible_at
FROM batch_stops bs;
