import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { ProductPerformance } from "@/hooks/useAnalytics";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ProductAnalysisProps {
  productPerformance: ProductPerformance[];
}

export const ProductAnalysis = ({ productPerformance }: ProductAnalysisProps) => {
  const formatCurrency = (value: number) => 
    `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;

  // Top 5 produits par revenus pour le graphique
  const topProductsChart = productPerformance
    .slice(0, 5)
    .map(p => ({
      name: p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName,
      revenue: p.totalRevenue,
      sold: p.totalSold
    }));

  // Données pour le pie chart des revenus
  const revenueChartData = productPerformance
    .slice(0, 6)
    .map((p, index) => ({
      name: p.productName,
      value: p.totalRevenue,
      fill: `hsl(${(index * 60) % 360}, 70%, 50%)`
    }));

  // Ajouter "Autres" si plus de 6 produits
  if (productPerformance.length > 6) {
    const otherRevenue = productPerformance
      .slice(6)
      .reduce((sum, p) => sum + p.totalRevenue, 0);
    
    if (otherRevenue > 0) {
      revenueChartData.push({
        name: 'Autres',
        value: otherRevenue,
        fill: '#94a3b8'
      });
    }
  }

  const getStockRotationBadge = (rotation: number) => {
    if (rotation >= 3) return { variant: "default" as const, label: "Excellente" };
    if (rotation >= 1.5) return { variant: "secondary" as const, label: "Bonne" };
    if (rotation >= 0.5) return { variant: "outline" as const, label: "Correcte" };
    return { variant: "destructive" as const, label: "Faible" };
  };

  return (
    <div className="space-y-6">
      {/* Métriques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits actifs</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {productPerformance.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {productPerformance.filter(p => p.totalSold > 0).length} avec ventes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure vente</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600 truncate">
              {productPerformance[0]?.productName || 'Aucun'}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(productPerformance[0]?.totalRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {productPerformance.filter(p => p.isLowStock).length}
            </div>
            <p className="text-xs text-muted-foreground">
              produit(s) en alerte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produits par revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 produits par revenus</CardTitle>
            <CardDescription>Performance des meilleures ventes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenus' : 'Quantité vendue'
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition des revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des revenus</CardTitle>
            <CardDescription>Part de chaque produit dans le CA</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Performance détaillée par produit</CardTitle>
          <CardDescription>Analyse complète des performances</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Quantité vendue</TableHead>
                <TableHead>Revenus</TableHead>
                <TableHead>Prix moyen</TableHead>
                <TableHead>Rotation stock</TableHead>
                <TableHead>Stock actuel</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productPerformance.map((product) => {
                const rotationBadge = getStockRotationBadge(product.stockRotation);
                const stockPercentage = Math.min((product.currentStock / (product.alertThreshold * 2)) * 100, 100);
                
                return (
                  <TableRow key={product.productId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{product.productName}</span>
                        {product.isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{product.totalSold}</TableCell>
                    <TableCell>{formatCurrency(product.totalRevenue)}</TableCell>
                    <TableCell>{formatCurrency(product.averageSellingPrice)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{product.stockRotation}</span>
                        <Badge variant={rotationBadge.variant} className="text-xs">
                          {rotationBadge.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{product.currentStock}</span>
                          <span className="text-muted-foreground">
                            Seuil: {product.alertThreshold}
                          </span>
                        </div>
                        <Progress 
                          value={stockPercentage} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.isLowStock ? (
                        <Badge variant="destructive">
                          {product.currentStock === 0 ? "Rupture" : "Stock faible"}
                        </Badge>
                      ) : (
                        <Badge variant="default">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};