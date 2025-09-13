
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';
import { toast } from '@/hooks/use-toast';

export interface Transaction {
  id: string;
  product_id: string;
  organization_id: string;
  transaction_type: 'achat' | 'vente';
  quantity: number;
  price_per_unit: number;
  total_amount: number;
  created_at: string;
  products: {
    name: string;
  };
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { organization } = useOrganization();

  const fetchTransactions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          products (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedTransactions = (data || []).map(transaction => ({
        ...transaction,
        transaction_type: transaction.transaction_type as 'achat' | 'vente'
      }));
      
      setTransactions(typedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive"
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transactionData: {
    productId: string;
    type: 'achat' | 'vente';
    quantity: number;
    pricePerUnit?: number;
  }) => {
    if (!user || !organization || isSubmitting) return false;

    setIsSubmitting(true);
    console.log('Starting transaction:', transactionData);

    // Protection contre les doubles soumissions
    const startTime = Date.now();

    try {
      // Validation des données
      if (!transactionData.productId || transactionData.quantity <= 0) {
        throw new Error('Données de transaction invalides');
      }

      // Récupérer les données actuelles du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', transactionData.productId)
        .maybeSingle();

      if (productError) {
        console.error('Product fetch error:', productError);
        throw new Error('Produit non trouvé');
      }

      if (!product) {
        throw new Error('Produit non trouvé');
      }

      console.log('Current product data:', product);

      // Calcul du prix par unité
      const pricePerUnit = Math.round(transactionData.pricePerUnit ?? product.selling_price_per_unit ?? product.selling_price_per_bottle);
      
      // Vérification du stock pour les ventes
      if (transactionData.type === 'vente' && product.stock_quantity < transactionData.quantity) {
        throw new Error(`Stock insuffisant. Stock disponible: ${product.stock_quantity} ${product.unit_label}`);
      }

      // Calcul du nouveau stock
      const newStock = transactionData.type === 'achat' 
        ? product.stock_quantity + transactionData.quantity
        : product.stock_quantity - transactionData.quantity;

      console.log('New stock calculated:', newStock);

      // Transaction atomique : créer la transaction et mettre à jour le stock
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          product_id: transactionData.productId,
          transaction_type: transactionData.type,
          quantity: transactionData.quantity,
          price_per_unit: pricePerUnit,
          total_amount: pricePerUnit * transactionData.quantity
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }

      // Mettre à jour le stock du produit
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', transactionData.productId);

      if (updateError) {
        console.error('Stock update error:', updateError);
        throw updateError;
      }

      await fetchTransactions();
      
      const actionText = transactionData.type === 'achat' ? 'Achat' : 'Vente';
      toast({
        title: "Transaction enregistrée",
        description: `${actionText} de ${transactionData.quantity} ${product.unit_label} enregistré avec succès`,
      });

      console.log('Transaction completed successfully');
      
      // Protection anti-double clic: attendre au moins 800ms
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'enregistrer la transaction",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  return {
    transactions,
    loading,
    isSubmitting,
    addTransaction,
    refetch: fetchTransactions
  };
};
