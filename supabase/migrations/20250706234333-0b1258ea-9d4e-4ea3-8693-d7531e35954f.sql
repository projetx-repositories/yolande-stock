-- Créer les tables SaaS
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'enterprise')),
  max_products INTEGER NOT NULL DEFAULT 5,
  max_transactions_per_month INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ajouter organization_id aux tables existantes
ALTER TABLE public.products ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Organization owners can update their organization"
ON public.organizations FOR UPDATE
USING (id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role = 'owner'
));

-- Politiques RLS pour organization_members
CREATE POLICY "Users can view members of their organization"
ON public.organization_members FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Organization owners can manage members"
ON public.organization_members FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role = 'owner'
));

-- Politiques RLS pour subscribers
CREATE POLICY "Users can view their own subscription"
ON public.subscribers FOR SELECT
USING (user_id = auth.uid() OR organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role = 'owner'
));

CREATE POLICY "Users can update their own subscription"
ON public.subscribers FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert subscriptions"
ON public.subscribers FOR INSERT
WITH CHECK (true);

-- Mettre à jour les politiques RLS existantes pour utiliser organization_id
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create products in their organization"
ON public.products FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update products in their organization"
ON public.products FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete products in their organization"
ON public.products FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Mettre à jour les politiques RLS pour transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;

CREATE POLICY "Users can view transactions in their organization"
ON public.transactions FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create transactions in their organization"
ON public.transactions FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Mettre à jour les politiques RLS pour profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Ajouter des index pour les performances
CREATE INDEX ON public.organization_members (user_id);
CREATE INDEX ON public.organization_members (organization_id);
CREATE INDEX ON public.products (organization_id);
CREATE INDEX ON public.transactions (organization_id);
CREATE INDEX ON public.subscribers (user_id);
CREATE INDEX ON public.subscribers (organization_id);
CREATE INDEX ON public.profiles (organization_id);

-- Trigger pour updated_at sur organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour updated_at sur subscribers
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer automatiquement une organisation lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  new_org_id uuid;
  org_name text;
  org_slug text;
BEGIN
  -- Récupérer le nom de la structure depuis les métadonnées
  org_name := COALESCE(NEW.raw_user_meta_data ->> 'structure_name', 'Mon Entreprise');
  
  -- Créer un slug unique basé sur l'email et un timestamp
  org_slug := LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Créer l'organisation
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;
  
  -- Créer le profil utilisateur avec l'organisation
  INSERT INTO public.profiles (id, structure_name, organization_id)
  VALUES (NEW.id, org_name, new_org_id);
  
  -- Ajouter l'utilisateur comme propriétaire de l'organisation
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Migrer les données existantes (créer une organisation pour chaque utilisateur existant)
DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
  org_slug text;
BEGIN
  -- Pour chaque profil existant sans organization_id
  FOR user_record IN 
    SELECT p.id, p.structure_name, u.email
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.organization_id IS NULL
  LOOP
    -- Créer un slug unique
    org_slug := LOWER(REPLACE(SPLIT_PART(user_record.email, '@', 1), '.', '-')) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || SUBSTRING(user_record.id::TEXT FROM 1 FOR 8);
    
    -- Créer l'organisation
    INSERT INTO public.organizations (name, slug)
    VALUES (user_record.structure_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Mettre à jour le profil avec l'organization_id
    UPDATE public.profiles 
    SET organization_id = new_org_id 
    WHERE id = user_record.id;
    
    -- Ajouter l'utilisateur comme propriétaire
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, user_record.id, 'owner');
    
    -- Mettre à jour les produits existants
    UPDATE public.products 
    SET organization_id = new_org_id 
    WHERE user_id = user_record.id;
    
    -- Mettre à jour les transactions existantes
    UPDATE public.transactions 
    SET organization_id = new_org_id 
    WHERE user_id = user_record.id;
  END LOOP;
END $$;