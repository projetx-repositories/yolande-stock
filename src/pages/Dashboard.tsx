
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft, AlertTriangle, Trash2, Plus, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";

const Dashboard = () => {
  const navigate = useNavigate();
  const { products, deleteProduct } = useProducts();

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
      deleteProduct(productId);
    }
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock_quantity <= p.alert_threshold);
  };

  const getTotalStock = () => {
    return products.reduce((total, product) => total + product.stock_quantity, 0);
  };

  const getStockValue = () => {
    return products.reduce((total, product) => total + (product.stock_quantity * (product.selling_price_per_unit || product.selling_price_per_bottle)), 0);
  };

  const lowStockProducts = getLowStockProducts();

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
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">Yolande Stock</h1>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => navigate("/add-product")}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button onClick={() => navigate("/transactions")} variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Transaction
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">État des stocks</h2>
          <p className="text-gray-600">Vue d'ensemble de votre inventaire</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produits totaux</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">articles différents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalStock()}</div>
              <p className="text-xs text-muted-foreground">unités</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertes stock</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${lowStockProducts.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockProducts.length > 0 ? 'text-red-600' : ''}`}>
                {lowStockProducts.length}
              </div>
              <p className="text-xs text-muted-foreground">produits en rupture</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur stock</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getStockValue().toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alertes de stock bas
              </CardTitle>
              <CardDescription className="text-red-600">
                {lowStockProducts.length} produit(s) nécessitent un réapprovisionnement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded border border-red-200">
                    <span className="font-medium">{product.name}</span>
                    <Badge variant="destructive">
                      {product.stock_quantity} / {product.alert_threshold}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des produits</CardTitle>
            <CardDescription>
              Gérez votre inventaire et surveillez les niveaux de stock
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Stock actuel</TableHead>
                  <TableHead>Seuil d'alerte</TableHead>
                  <TableHead>Prix de vente</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.stock_quantity} {product.unit_label}</TableCell>
                    <TableCell>{product.alert_threshold}</TableCell>
                    <TableCell>{Math.round(product.selling_price_per_unit || product.selling_price_per_bottle).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</TableCell>
                    <TableCell>
                      {product.stock_quantity <= product.alert_threshold ? (
                        <Badge variant="destructive">Stock bas</Badge>
                      ) : product.stock_quantity <= product.alert_threshold * 2 ? (
                        <Badge variant="secondary">Attention</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
