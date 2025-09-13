
-- 0) Nettoyage préalable (évite collisions)
DROP FUNCTION IF EXISTS public.get_user_organization_id_safe();
-- On garde get_user_organization_id mais on le remplace ci-dessous

-- 1) Fonctions sécurisées et sans récursion

-- 1.a) Renvoie l'organization_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
  limit 1
$$;

-- 1.b) Vrai si l'utilisateur courant est owner de l'organisation donnée
CREATE OR REPLACE FUNCTION public.is_owner_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  select exists (
    select 1
    from public.organization_members
    where user_id = auth.uid()
      and organization_id = org_id
      and role = 'owner'
  )
$$;

-- Tenter d'assigner l'owner à postgres pour s'assurer du bypass RLS
-- (si la plateforme l'autorise)
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.get_user_organization_id() OWNER TO postgres;
  EXCEPTION WHEN OTHERS THEN
    -- ignorer si non autorisé
    NULL;
  END;
  BEGIN
    ALTER FUNCTION public.is_owner_of_org(uuid) OWNER TO postgres;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 2) Policies organization_members (suppression et recréation sans récursion)

DROP POLICY IF EXISTS "Allow organization owners to manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Allow users to see organization members via function" ON public.organization_members;
DROP POLICY IF EXISTS "Allow users to see their own membership record" ON public.organization_members;
DROP POLICY IF EXISTS "Users can see their own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can see members in their org" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.organization_members;

-- SELECT: voir sa propre ligne
CREATE POLICY "Users can see their own membership"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- SELECT: voir les membres de son organisation
CREATE POLICY "Users can see members in their org"
ON public.organization_members
FOR SELECT
USING (organization_id = public.get_user_organization_id());

-- ALL: gérer les membres uniquement si owner
CREATE POLICY "Owners can manage members"
ON public.organization_members
FOR ALL
USING (public.is_owner_of_org(organization_id))
WITH CHECK (public.is_owner_of_org(organization_id));

-- 3) Renforcer les policies existantes (optionnel mais sûr): organisations / products / transactions

-- Organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
CREATE POLICY "Organization owners can update their organization"
ON public.organizations
FOR UPDATE
USING (public.is_owner_of_org(id));

-- Products (on réassure l’usage de la fonction)
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
CREATE POLICY "Users can view products in their organization"
ON public.products
FOR SELECT
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can create products in their organization" ON public.products;
CREATE POLICY "Users can create products in their organization"
ON public.products
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can update products in their organization" ON public.products;
CREATE POLICY "Users can update products in their organization"
ON public.products
FOR UPDATE
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete products in their organization" ON public.products;
CREATE POLICY "Users can delete products in their organization"
ON public.products
FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Transactions
DROP POLICY IF EXISTS "Users can view transactions in their organization" ON public.transactions;
CREATE POLICY "Users can view transactions in their organization"
ON public.transactions
FOR SELECT
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can create transactions in their organization" ON public.transactions;
CREATE POLICY "Users can create transactions in their organization"
ON public.transactions
FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

-- 4) Provisioning auto de l’organisation à l’inscription (fix du trigger)

-- On remplace la fonction handle_new_user avec un search_path correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_org_id uuid;
  org_name text;
  org_slug text;
BEGIN
  -- Nom de structure depuis les métadonnées d'inscription
  org_name := COALESCE(NEW.raw_user_meta_data ->> 'structure_name', 'Mon Entreprise');

  -- Slug unique
  org_slug := LOWER(REPLACE(SPLIT_PART(NEW.email, '@', 1), '.', '-')) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;

  -- Créer organisation
  INSERT INTO public.organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  -- Créer profil
  INSERT INTO public.profiles (id, structure_name, organization_id)
  VALUES (NEW.id, org_name, new_org_id);

  -- Ajouter membership owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Créer (ou recréer) le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
