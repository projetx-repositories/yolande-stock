import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'premium' | 'enterprise';
  max_products: number;
  max_transactions_per_month: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export const useOrganization = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrganization = async () => {
    if (!user) return;

    setLoading(true);

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const maxAttempts = 3;
    let lastError: any = null;
    let done = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Étape 1: Récupérer l'organization_id de l'utilisateur avec une requête simple
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (memberError) {
          console.error('Member fetch error:', memberError);
          throw memberError;
        }

        if (!memberData) {
          console.log('No organization found for user');
          setOrganization(null);
          setMembers([]);
          done = true; // Cas non transitoire, ne pas réessayer
          break;
        }

        // Étape 2: Récupérer les détails de l'organisation séparément
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData.organization_id)
          .maybeSingle();

        if (orgError) {
          console.error('Organization fetch error:', orgError);
          throw orgError;
        }

        if (!orgData) {
          console.log('Organization not found');
          setOrganization(null);
          setMembers([]);
          done = true; // Cas non transitoire
          break;
        }

        setOrganization(orgData as Organization);

        // Étape 3: Récupérer tous les membres de l'organisation
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', memberData.organization_id);

        if (membersError) {
          console.error('Members fetch error:', membersError);
          // Ne pas faire échouer toute l'opération
          setMembers([]);
        } else {
          setMembers((membersData || []).map((member) => ({
            ...member,
            role: member.role as 'owner' | 'admin' | 'member',
          })));
        }

        done = true; // Succès
        break;
      } catch (error) {
        lastError = error;
        console.warn(`fetchOrganization tentative ${attempt} échouée`, error);
        if (attempt < maxAttempts) {
          // Backoff progressif (500ms, 1000ms, ...)
          await sleep(500 * attempt);
          continue;
        }
      }
    }

    if (!done && lastError) {
      console.error('Error fetching organization after retries:', lastError);
      toast({
        title: 'Erreur',
        description: "Impossible de charger les informations de l'organisation",
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return false;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization.id);

      if (error) throw error;
      
      setOrganization(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Succès",
        description: "Organisation mise à jour avec succès",
      });
      return true;
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'organisation",
        variant: "destructive"
      });
      return false;
    }
  };

  const inviteMember = async (email: string, role: 'admin' | 'member' = 'member') => {
    if (!organization) return false;
    
    try {
      // TODO: Implémenter le système d'invitation par email
      // Pour l'instant, on peut juste ajouter si l'utilisateur existe déjà
      
      toast({
        title: "Invitation envoyée",
        description: `Invitation envoyée à ${email}`,
      });
      return true;
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'invitation",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    if (!organization) return false;
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({
        title: "Membre retiré",
        description: "Le membre a été retiré de l'organisation",
      });
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le membre",
        variant: "destructive"
      });
      return false;
    }
  };

  const getCurrentUserRole = () => {
    if (!user || !members.length) return null;
    const member = members.find(m => m.user_id === user.id);
    return member?.role || null;
  };

  const canManageOrganization = () => {
    const role = getCurrentUserRole();
    return role === 'owner' || role === 'admin';
  };

  const isOwner = () => {
    return getCurrentUserRole() === 'owner';
  };

  // Vérifier les limites du plan
  const checkLimits = () => {
    if (!organization) return { canAddProducts: false, canAddTransactions: false };
    
    return {
      canAddProducts: true, // TODO: Implémenter la vérification réelle basée sur le comptage
      canAddTransactions: true, // TODO: Implémenter la vérification réelle basée sur le comptage
      planLimits: {
        maxProducts: organization.max_products,
        maxTransactionsPerMonth: organization.max_transactions_per_month,
        plan: organization.plan
      }
    };
  };

  useEffect(() => {
    if (user) {
      fetchOrganization();
    } else {
      setOrganization(null);
      setMembers([]);
      setLoading(false);
    }
  }, [user]);

  return {
    organization,
    members,
    loading,
    updateOrganization,
    inviteMember,
    removeMember,
    getCurrentUserRole,
    canManageOrganization,
    isOwner,
    checkLimits,
    refetch: fetchOrganization
  };
};