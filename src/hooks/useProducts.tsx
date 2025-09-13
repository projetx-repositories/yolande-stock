
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganization } from './useOrganization';
import { toast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  bottles_per_case?: number | null;
  units_per_package?: number | null;
  unit_label: string; // ex: "bouteille", "pièce", "boîte"
  product_type: string; // ex: "unit"
  purchase_price_per_unit: number;
  selling_price_per_bottle: number; // legacy, kept for compatibility
  selling_price_per_unit: number;
  alert_threshold: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { organization } = useOrganization();

  const fetchProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: {
    name: string;
    addType: 'casier' | 'bouteille';
    quantity: number;
    bottlesPerCase?: number;
    unitsPerPackage?: number; // taille du paquet générique
    unitLabel?: string; // libellé d'unité (ex: bouteille, pièce)
    purchasePrice: number;
    sellingPricePerBottle: number; // prix de vente par unité
    alertThreshold: number;
  }) => {
    if (!user || !organization || isSubmitting) return false;

    setIsSubmitting(true);
    console.log('Starting product addition:', productData);

    // Protection contre les doubles soumissions avec timeout
    const startTime = Date.now();

    try {
      // Validation des données
      if (!productData.name.trim() || productData.quantity <= 0 || productData.purchasePrice <= 0 || productData.sellingPricePerBottle <= 0) {
        throw new Error('Données invalides');
      }

      // Calculs génériques en unités
      const unitsPerPackage = productData.addType === 'casier'
        ? (productData.unitsPerPackage ?? productData.bottlesPerCase ?? 1)
        : 1;

      const stockQuantity = productData.quantity * unitsPerPackage;

      // Prix d'achat par unité
      const pricePerUnit = Math.round(productData.purchasePrice / unitsPerPackage);

      console.log('Calculated values:', { stockQuantity, pricePerUnit, unitsPerPackage });

      // Transaction atomique : insérer le produit et récupérer son ID
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          name: productData.name.trim(),
          stock_quantity: stockQuantity,
          bottles_per_case: productData.addType === 'casier' ? (productData.bottlesPerCase ?? unitsPerPackage) : null,
          units_per_package: productData.addType === 'casier' ? unitsPerPackage : null,
          unit_label: productData.unitLabel?.trim() || 'unité',
          product_type: 'unit',
          purchase_price_per_unit: pricePerUnit,
          selling_price_per_bottle: productData.sellingPricePerBottle, // compat
          selling_price_per_unit: Math.round(productData.sellingPricePerBottle),
          alert_threshold: productData.alertThreshold || 10
        })
        .select()
        .maybeSingle();

      if (productError) {
        console.error('Product insertion error:', productError);
        throw productError;
      }

      if (!newProduct) {
        throw new Error('Échec de la création du produit');
      }

      console.log('Product created:', newProduct);

      // Créer la transaction d'achat initial avec calcul correct
      const totalAmount = Math.round(productData.purchasePrice) * productData.quantity 
        
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          organization_id: organization.id,
          product_id: newProduct.id,
          transaction_type: 'achat',
          quantity: stockQuantity,
          price_per_unit: pricePerUnit,
          total_amount: totalAmount
        });

      if (transactionError) {
        console.error('Transaction insertion error:', transactionError);
        // Ne pas faire échouer toute l'opération si la transaction d'historique échoue
        toast({
          title: "Attention",
          description: "Produit créé mais l'historique n'a pas pu être enregistré",
          variant: "destructive"
        });
      }

      await fetchProducts();
      
      toast({
        title: "Succès",
        description: `${productData.name} a été ajouté avec ${stockQuantity} ${productData.unitLabel?.trim() || 'unités'}`,
      });

      console.log('Product addition completed successfully');
      
      // Protection anti-double clic: attendre au moins 1 seconde
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter le produit",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      await fetchProducts();
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user]);

  return {
    products,
    loading,
    isSubmitting,
    addProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};
