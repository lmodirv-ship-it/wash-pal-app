ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS name_fr text,
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS description_fr text,
  ADD COLUMN IF NOT EXISTS description_en text;

UPDATE public.services SET name_ar = COALESCE(name_ar, name) WHERE name_ar IS NULL;
UPDATE public.services SET description_ar = COALESCE(description_ar, description) WHERE description_ar IS NULL AND description IS NOT NULL;