-- Supprimer les politiques RLS problématiques qui causent la récursion
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;

-- Créer une fonction sécurisée pour récupérer l'organization_id de l'utilisateur
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recréer les politiques RLS pour organization_members sans récursion
CREATE POLICY "Users can view members of their organization"
ON public.organization_members FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Organization owners can manage members"
ON public.organization_members FOR ALL
USING (organization_id IN (
  SELECT om.organization_id 
  FROM public.organization_members om
  WHERE om.user_id = auth.uid() AND om.role = 'owner'
));

-- Mettre à jour les politiques pour les autres tables pour utiliser la fonction
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Organization owners can update their organization" ON public.organizations;
CREATE POLICY "Organization owners can update their organization"
ON public.organizations FOR UPDATE
USING (id IN (
  SELECT om.organization_id 
  FROM public.organization_members om
  WHERE om.user_id = auth.uid() AND om.role = 'owner'
));

-- Mettre à jour les politiques pour products
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can create products in their organization" ON public.products;
CREATE POLICY "Users can create products in their organization"
ON public.products FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can update products in their organization" ON public.products;
CREATE POLICY "Users can update products in their organization"
ON public.products FOR UPDATE
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can delete products in their organization" ON public.products;
CREATE POLICY "Users can delete products in their organization"
ON public.products FOR DELETE
USING (organization_id = public.get_user_organization_id());

-- Mettre à jour les politiques pour transactions
DROP POLICY IF EXISTS "Users can view transactions in their organization" ON public.transactions;
CREATE POLICY "Users can view transactions in their organization"
ON public.transactions FOR SELECT
USING (organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Users can create transactions in their organization" ON public.transactions;
CREATE POLICY "Users can create transactions in their organization"
ON public.transactions FOR INSERT
WITH CHECK (organization_id = public.get_user_organization_id());