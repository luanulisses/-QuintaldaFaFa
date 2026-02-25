-- Script to clean up duplicate leads
-- Keeps only the record with the most recent created_at for each name/phone/event_date combination

WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY name, phone, COALESCE(event_date, '1900-01-01')
               ORDER BY created_at DESC
           ) as row_num
    FROM public.leads
)
DELETE FROM public.leads
WHERE id IN (
    SELECT id
    FROM duplicates
    WHERE row_num > 1
);
