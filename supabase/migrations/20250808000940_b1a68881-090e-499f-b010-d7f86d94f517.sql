
-- 1) Ajouter les colonnes nécessaires pour les unités génériques
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit_label text,
  ADD COLUMN IF NOT EXISTS units_per_package integer,
  ADD COLUMN IF NOT EXISTS selling_price_per_unit numeric,
  ADD COLUMN IF NOT EXISTS product_type text;

-- 2) Valeurs par défaut et rétro-remplissage pour rester compatible
-- Par défaut, on garde "bouteille" pour ne pas casser l'existant
ALTER TABLE public.products
  ALTER COLUMN unit_label SET DEFAULT 'bouteille';

UPDATE public.products
SET unit_label = COALESCE(unit_label, 'bouteille');

-- On recopie le prix par bouteille dans le nouveau prix par unité
UPDATE public.products
SET selling_price_per_unit = selling_price_per_bottle
WHERE selling_price_per_unit IS NULL;

-- Définir NOT NULL + DEFAULT pour les nouvelles colonnes critiques
ALTER TABLE public.products
  ALTER COLUMN unit_label SET NOT NULL;

ALTER TABLE public.products
  ALTER COLUMN selling_price_per_unit SET DEFAULT 0;

ALTER TABLE public.products
  ALTER COLUMN selling_price_per_unit SET NOT NULL;

-- Product type générique pour prévoir d'autres variantes (ex: "unit", "weighted")
ALTER TABLE public.products
  ALTER COLUMN product_type SET DEFAULT 'unit';

UPDATE public.products
SET product_type = COALESCE(product_type, 'unit');

ALTER TABLE public.products
  ALTER COLUMN product_type SET NOT NULL;

-- 3) Sécurité des données (optionnel mais sain): taille de paquet > 0 si renseignée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_units_per_package_positive'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_units_per_package_positive
      CHECK (units_per_package IS NULL OR units_per_package > 0);
  END IF;
END$$;
