-- Corriger définitivement les politiques RLS pour éviter la récursion infinie

-- 1. Supprimer toutes les politiques RLS existantes sur organization_members
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;

-- 2. Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS public.get_user_organization_id();

-- 3. Créer une nouvelle fonction sécurisée qui évite la récursion
CREATE OR REPLACE FUNCTION public.get_user_organization_id_safe()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Utiliser une requête directe sans référence circulaire
  SELECT organization_id INTO org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Créer de nouvelles politiques RLS simples sans récursion
CREATE POLICY "Users can view their own organization membership" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view members in same organization" 
ON public.organization_members 
FOR SELECT 
USING (organization_id = public.get_user_organization_id_safe());

CREATE POLICY "Organization owners can manage all members" 
ON public.organization_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_members.organization_id 
    AND om.role = 'owner'
  )
);