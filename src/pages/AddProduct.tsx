
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

const AddProduct = () => {
  const navigate = useNavigate();
  const { addProduct, isSubmitting } = useProducts();
  const [formData, setFormData] = useState({
    name: "",
    unitLabel: "unité",
    addType: "casier" as "casier" | "bouteille",
    quantity: "",
    bottlesPerCase: "",
    purchasePrice: "",
    sellingPricePerBottle: "",
    alertThreshold: ""
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
    
    // Validation côté client
    if (!formData.name.trim()) {
      return;
    }
    
    if (!formData.quantity || isNaN(parseInt(formData.quantity)) || parseInt(formData.quantity) <= 0) {
      return;
    }
    
    if (formData.addType === "casier" && (!formData.bottlesPerCase || isNaN(parseInt(formData.bottlesPerCase)) || parseInt(formData.bottlesPerCase) <= 0)) {
      return;
    }
    
    if (!formData.purchasePrice || isNaN(parseFloat(formData.purchasePrice)) || parseFloat(formData.purchasePrice) <= 0) {
      return;
    }
    
    if (!formData.sellingPricePerBottle || isNaN(parseFloat(formData.sellingPricePerBottle)) || parseFloat(formData.sellingPricePerBottle) <= 0) {
      return;
    }
    
    const success = await addProduct({
      name: formData.name,
      addType: formData.addType,
      quantity: parseInt(formData.quantity),
      bottlesPerCase: formData.addType === "casier" ? parseInt(formData.bottlesPerCase) : undefined,
      unitsPerPackage: formData.addType === "casier" ? parseInt(formData.bottlesPerCase) : undefined,
      unitLabel: formData.unitLabel,
      purchasePrice: parseFloat(formData.purchasePrice),
      sellingPricePerBottle: parseFloat(formData.sellingPricePerBottle),
      alertThreshold: parseInt(formData.alertThreshold) || 10
    });

    if (success) {
      setFormData({
        name: "",
        unitLabel: "unité",
        addType: "casier",
        quantity: "",
        bottlesPerCase: "",
        purchasePrice: "",
        sellingPricePerBottle: "",
        alertThreshold: ""
      });
    }
  };

  // Calculs stabilisés avec useMemo basés sur les valeurs debouncées
  const calculatedInfo = useMemo(() => {
    // Ne pas calculer si un champ pertinent est en cours d'édition
    if (focusedField && ['quantity', 'bottlesPerCase', 'purchasePrice'].includes(focusedField)) {
      return null;
    }
    
    if (debouncedValues.addType !== "casier") return null;
    
    const quantity = parseInt(debouncedValues.quantity);
    const bottlesPerCase = parseInt(debouncedValues.bottlesPerCase);
    const purchasePrice = parseFloat(debouncedValues.purchasePrice);
    
    if (isNaN(quantity) || isNaN(bottlesPerCase) || isNaN(purchasePrice) || quantity <= 0 || bottlesPerCase <= 0 || purchasePrice <= 0) {
      return null;
    }
    
    const pricePerBottle = Math.round(purchasePrice / bottlesPerCase);
    return {
      totalBottles: quantity * bottlesPerCase,
      pricePerBottle
    };
  }, [debouncedValues.addType, debouncedValues.quantity, debouncedValues.bottlesPerCase, debouncedValues.purchasePrice, focusedField]);

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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Ajouter un produit</h2>
          <p className="text-gray-600">Créer un nouvel article dans votre stock</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
            <CardDescription>
              Saisissez les détails de votre nouveau produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Nom du produit"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onFocus={() => handleFocus("name")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Unit Label */}
              <div>
                <Label htmlFor="unitLabel">Unité du produit *</Label>
                <Input
                  id="unitLabel"
                  placeholder="Ex: unité, pièce, boîte, sachet, bouteille"
                  value={formData.unitLabel}
                  onChange={(e) => handleInputChange("unitLabel", e.target.value)}
                  onFocus={() => handleFocus("unitLabel")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Add Type */}
              <div>
                <Label>Type d'ajout *</Label>
                <RadioGroup 
                  value={formData.addType} 
                  onValueChange={(value) => handleInputChange("addType", value)}
                  className="mt-2"
                  disabled={isSubmitting}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casier" id="casier" />
                    <Label htmlFor="casier">Par paquet</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bouteille" id="bouteille" />
                    <Label htmlFor="bouteille">Par unité</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">
                  Quantité ajoutée * 
                  <span className="text-sm text-gray-500 ml-1">
                    ({formData.addType === "casier" ? "nombre de paquets" : "nombre d'unités"})
                  </span>
                </Label>
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
              </div>

              {/* Bottles per case - only if type is casier */}
              {formData.addType === "casier" && (
                <div>
                  <Label htmlFor="bottlesPerCase">Unités par paquet *</Label>
                  <Input
                    id="bottlesPerCase"
                    type="text"
                    placeholder="Nombre d'unités"
                    value={formData.bottlesPerCase}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      handleInputChange("bottlesPerCase", value);
                    }}
                    onFocus={() => handleFocus("bottlesPerCase")}
                    onBlur={handleBlur}
                    className="mt-1"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}

              {/* Purchase Price */}
              <div>
                <Label htmlFor="purchasePrice">
                  Prix d'achat * 
                  <span className="text-sm text-gray-500 ml-1">
                    ({formData.addType === "casier" ? "par paquet" : "par unité"} en FCFA)
                  </span>
                </Label>
                <Input
                  id="purchasePrice"
                  type="text"
                  placeholder="Prix d'achat"
                  value={formData.purchasePrice}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange("purchasePrice", value);
                  }}
                  onFocus={() => handleFocus("purchasePrice")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Selling Price per bottle */}
              <div>
                <Label htmlFor="sellingPricePerBottle">Prix de vente par unité * (FCFA)</Label>
                <Input
                  id="sellingPricePerBottle"
                  type="text"
                  placeholder="Prix de vente"
                  value={formData.sellingPricePerBottle}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange("sellingPricePerBottle", value);
                  }}
                  onFocus={() => handleFocus("sellingPricePerBottle")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {/* Alert Threshold */}
              <div>
                <Label htmlFor="alertThreshold">Seuil d'alerte (unités)</Label>
                <Input
                  id="alertThreshold"
                  type="text"
                  placeholder="Seuil d'alerte"
                  value={formData.alertThreshold}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange("alertThreshold", value);
                  }}
                  onFocus={() => handleFocus("alertThreshold")}
                  onBlur={handleBlur}
                  className="mt-1"
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Stock minimum avant alerte
                </p>
              </div>

              {/* Calculated Information Display - Affichage uniquement */}
              {calculatedInfo && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Calculs automatiques</h4>
                  <div className="space-y-1 text-sm text-green-700">
                    <p>Stock initial total: {calculatedInfo.totalBottles} {formData.unitLabel || 'unités'}</p>
                    <p>Prix d'achat par unité: {Number(calculatedInfo.pricePerBottle).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</p>
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    "Ajouter le produit"
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

export default AddProduct;
