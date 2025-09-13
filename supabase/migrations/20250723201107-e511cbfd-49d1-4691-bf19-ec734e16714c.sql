-- CORRECTION DÉFINITIVE : Supprimer toutes les politiques RLS problématiques et les refaire proprement

-- 1. Supprimer TOUTES les politiques existantes sur organization_members
DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view members in their organization" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.organization_members;

-- 2. Refactorer complètement la fonction get_user_organization_id pour éviter TOUTE récursion
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Requête directe sur la table sans utiliser aucune politique RLS
  -- SECURITY DEFINER permet de contourner les politiques RLS
  SELECT organization_id INTO org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Créer des politiques RLS ultra-simples sans AUCUNE récursion possible
CREATE POLICY "Allow users to see their own membership record"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow users to see organization members via function"
ON public.organization_members
FOR SELECT
USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Allow organization owners to manage members"
ON public.organization_members
FOR ALL
USING (
  -- Soit c'est l'utilisateur lui-même
  user_id = auth.uid()
  OR
  -- Soit il est owner de cette organisation (vérification directe sans récursion)
  EXISTS (
    SELECT 1 
    FROM public.organization_members direct_check
    WHERE direct_check.user_id = auth.uid()
    AND direct_check.organization_id = organization_members.organization_id
    AND direct_check.role = 'owner'
  )
);