-- Fix security vulnerability: Remove organization owner access to subscriber data
-- This prevents unauthorized access to customer emails and Stripe payment data

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;

-- Create new restrictive policy that only allows users to view their own subscription data
CREATE POLICY "Users can only view their own subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

-- Keep the update policy as is (already secure)
-- Keep the insert policy as is (needed for system operations)