-- Backfill missing translations on services so the UI can display
-- the correct language for every service (no more French leaking
-- into the Arabic UI). When a localized name/description is missing,
-- copy the legacy `name`/`description` value into all three locales.

UPDATE public.services
SET name_fr = COALESCE(NULLIF(name_fr, ''), name)
WHERE name_fr IS NULL OR name_fr = '';

UPDATE public.services
SET name_ar = COALESCE(NULLIF(name_ar, ''), name)
WHERE name_ar IS NULL OR name_ar = '';

UPDATE public.services
SET name_en = COALESCE(NULLIF(name_en, ''), name)
WHERE name_en IS NULL OR name_en = '';

UPDATE public.services
SET description_fr = COALESCE(NULLIF(description_fr, ''), description)
WHERE (description_fr IS NULL OR description_fr = '') AND description IS NOT NULL AND description <> '';

UPDATE public.services
SET description_ar = COALESCE(NULLIF(description_ar, ''), description)
WHERE (description_ar IS NULL OR description_ar = '') AND description IS NOT NULL AND description <> '';

UPDATE public.services
SET description_en = COALESCE(NULLIF(description_en, ''), description)
WHERE (description_en IS NULL OR description_en = '') AND description IS NOT NULL AND description <> '';