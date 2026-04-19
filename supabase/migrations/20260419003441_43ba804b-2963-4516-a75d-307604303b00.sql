
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS starting_from BOOLEAN NOT NULL DEFAULT false;

-- Standard
UPDATE public.services SET category = 'standard', starting_from = false WHERE name IN (
  'Lavage voiture standard','Lavage grand véhicule (4x4)','Lavage intérieur','Lavage extérieur',
  'Lavage du châssis','Lavage moteur à l''eau chaude','Décontamination Extérieure','Nettoyage Tapis & Moquettes'
);

-- VIP
UPDATE public.services SET category = 'vip', starting_from = false WHERE name IN (
  'Lavage VIP (voiture standard)','Lavage VIP (grand véhicule)','Lavage complet Premium','Lustrage & Polish Complet'
);

-- Extra (with starting_from = true)
UPDATE public.services SET category = 'extra', starting_from = true WHERE name IN (
  'Polish & Protection Céramique','Nettoyage Intérieur Complet','Rénovation Phares & Jantes',
  'Contrôle et Vidange Rapide','Traitement Nano Protection','Traitement Hydrofuge Vitres','Désinfection à l''Ozone'
);

-- Packs
UPDATE public.services SET category = 'packs', starting_from = false WHERE name IN (
  'Pack Silver','Pack Gold','Pack Platinum'
);
