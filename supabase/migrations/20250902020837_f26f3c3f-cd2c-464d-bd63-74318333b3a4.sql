-- Add organization owner access to subscriber data within their organization
-- This allows organization owners to manage subscriptions for their organization members

-- Create policy for organization owners to view subscriber data in their organization
CREATE POLICY "Organization owners can view subscribers in their org" ON public.subscribers
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);

-- Create policy for organization owners to update subscriber data in their organization  
CREATE POLICY "Organization owners can update subscribers in their org" ON public.subscribers
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'owner'
  )
);