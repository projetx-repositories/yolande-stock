-- Corriger la récursion infinie en remplaçant la fonction existante

-- 1. Supprimer d'abord toutes les politiques problématiques sur organization_members
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;

-- 2. Remplacer la fonction get_user_organization_id pour éviter la récursion
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Requête directe sans récursion - évite les problèmes de policy circulaire
  SELECT organization_id INTO org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Créer de nouvelles politiques simples sans récursion pour organization_members
CREATE POLICY "Users can view their own membership" 
ON public.organization_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can view members in their organization" 
ON public.organization_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members om2 
    WHERE om2.user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can manage members" 
ON public.organization_members 
FOR ALL 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.organization_members om 
    WHERE om.user_id = auth.uid() 
    AND om.organization_id = organization_members.organization_id 
    AND om.role = 'owner'
  )
);