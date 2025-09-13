
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useTransactions } from "@/hooks/useTransactions";

const Transactions = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addTransaction, isSubmitting } = useTransactions();
  
  const [formData, setFormData] = useState({
    productId: "",
    transactionType: "vente" as "achat" | "vente",
    quantity: "",
    pricePerUnit: ""
  });
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [debouncedValues, setDebouncedValues] = useState(formData);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounce les valeurs pour les calculs
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setDebouncedValues(formData);
    }, 300);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formData]);
  
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);
  
  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await addTransaction({
      productId: formData.productId,
      type: formData.transactionType,
      quantity: parseInt(formData.quantity),
      pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined
    });

    if (success) {
      // Reset form après succès
      setFormData({
        productId: "",
        transactionType: "vente",
        quantity: "",
        pricePerUnit: ""
      });
    }
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  // Calcul du total stabilisé avec useMemo basé sur les valeurs debouncées
  const calculatedTotal = useMemo(() => {
    // Ne pas calculer si un champ pertinent est en cours d'édition
    if (focusedField && ['quantity', 'pricePerUnit'].includes(focusedField)) {
      return "0";
    }
    
    if (!debouncedValues.quantity || !selectedProduct) return "0";
    
    const quantity = parseInt(debouncedValues.quantity);
    const rawPrice = debouncedValues.pricePerUnit ? parseInt(debouncedValues.pricePerUnit) : (selectedProduct.selling_price_per_unit || selectedProduct.selling_price_per_bottle);
    const pricePerUnit = Math.round(Number(rawPrice));
    
    if (isNaN(quantity) || quantity <= 0) return "0";
    
    return (quantity * pricePerUnit).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  }, [debouncedValues.quantity, debouncedValues.pricePerUnit, selectedProduct, focusedField]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/dashboard")}
                className="flex items-center"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Yolande Stock</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Nouvelle transaction</h2>
          <p className="text-gray-600">Enregistrer un achat ou une vente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Détails de la transaction</CardTitle>
            <CardDescription>
              Sélectionnez le produit et saisissez les informations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Selection */}
              <div>
                <Label htmlFor="product">Produit *</Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={(value) => handleInputChange("productId", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionnez un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Type */}
              <div>
                <Label>Type de transaction *</Label>
                <RadioGroup 
                  value={formData.transactionType} 
                  onValueChange={(value) => handleInputChange("transactionType", value)}
                  className="mt-2"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="achat" id="achat" />
                    <Label htmlFor="achat">Achat (entrée de stock)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vente" id="vente" />
                    <Label htmlFor="vente">Vente (sortie de stock)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Quantité * (en unités)</Label>
                <Input
                  id="quantity"
                  type="text"
                  placeholder="Quantité"
                  value={formData.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange("quantity", value);
                  }}
                  onFocus={() => handleFocus("quantity")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required
                />
                {selectedProduct && formData.transactionType === "vente" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Stock disponible: {selectedProduct.stock_quantity} {selectedProduct.unit_label}
                  </p>
                )}
              </div>

              {/* Price per unit */}
              <div>
                <Label htmlFor="pricePerUnit">
                  Prix par unité 
                  {formData.transactionType === "achat" ? " *" : ""} (FCFA)
                </Label>
                <Input
                  id="pricePerUnit"
                  type="text"
                  placeholder="Prix par bouteille"
                  value={formData.pricePerUnit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange("pricePerUnit", value);
                  }}
                  onFocus={() => handleFocus("pricePerUnit")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required={formData.transactionType === "achat"}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.transactionType === "vente" 
                    ? "Laissez vide pour utiliser le prix de vente par défaut"
                    : "Prix d'achat par unité"
                  }
                </p>
              </div>

              {/* Transaction Summary */}
              {formData.quantity && selectedProduct && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Résumé de la transaction</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p>Produit: {selectedProduct.name}</p>
                    <p>Quantité: {formData.quantity} {selectedProduct.unit_label}</p>
                    <p>Prix unitaire: {Math.round(Number(formData.pricePerUnit || selectedProduct.selling_price_per_unit || selectedProduct.selling_price_per_bottle)).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
                    <p className="font-medium">
                      Total: {calculatedTotal} FCFA
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!formData.productId || !formData.quantity || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer la transaction"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
