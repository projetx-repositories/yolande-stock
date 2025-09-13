
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ArrowLeft, Search, BarChart3, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useAnalytics } from "@/hooks/useAnalytics";
import { FinancialAnalysis } from "@/components/FinancialAnalysis";
import { ProductAnalysis } from "@/components/ProductAnalysis";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DateRangePicker } from "@/components/DateRangePicker";
import { ExportButtons } from "@/components/ExportButtons";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

const History = () => {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { dateRanges, getTransactionsForPeriod, getPeriodStats, productPerformance, alerts, chartData } = useAnalytics();
  
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    selectedRange: "4" // Ce mois par défaut
  });

  const [customDates, setCustomDates] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  // Déterminer la période d'analyse
  const { selectedPeriod, periodTransactions, periodStats } = useMemo(() => {
    let start: Date, end: Date, label: string;
    
    if (filters.selectedRange === 'custom') {
      start = startOfDay(parseISO(customDates.start));
      end = endOfDay(parseISO(customDates.end));
      label = `Du ${format(start, 'dd MMM', { locale: fr })} au ${format(end, 'dd MMM yyyy', { locale: fr })}`;
    } else {
      const rangeIndex = parseInt(filters.selectedRange);
      const range = dateRanges[rangeIndex];
      start = range.start;
      end = range.end;
      label = range.label;
    }

    const periodTransactions = getTransactionsForPeriod(start, end);
    const periodStats = getPeriodStats(start, end);

    return {
      selectedPeriod: { start, end, label },
      periodTransactions,
      periodStats
    };
  }, [filters.selectedRange, customDates, dateRanges, getTransactionsForPeriod, getPeriodStats]);

  // Filtrer les transactions pour l'affichage du tableau
  const filteredTransactions = periodTransactions.filter(transaction => {
    const matchesSearch = transaction.products.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === "all" || transaction.transaction_type === filters.type;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (value: number) => 
    `${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => { if (window.history.length > 1) navigate(-1); else navigate("/dashboard"); }}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-green-600" />
                <h1 className="text-2xl font-bold text-gray-900">Yolande Stock</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Comptabilité & Historique</h2>
          <p className="text-gray-600">
            Analyse complète de votre activité - {selectedPeriod.label}
          </p>
        </div>

        {/* Sélection de période */}
        <div className="mb-6">
          <DateRangePicker
            dateRanges={dateRanges}
            selectedRange={filters.selectedRange}
            onRangeChange={(range) => setFilters(prev => ({ ...prev, selectedRange: range }))}
            customStartDate={customDates.start}
            customEndDate={customDates.end}
            onCustomDateChange={(start, end) => setCustomDates({ start, end })}
          />
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <AlertsPanel alerts={alerts} />
          </div>
        )}

        {/* Export */}
        <div className="mb-6">
          <ExportButtons
            transactions={periodTransactions}
            periodStats={periodStats}
            productPerformance={productPerformance}
            periodLabel={selectedPeriod.label}
          />
        </div>

        {/* Onglets d'analyse */}
        <Tabs defaultValue="financial" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Finances</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Produits</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Résumé</span>
            </TabsTrigger>
          </TabsList>

          {/* Analyse financière */}
          <TabsContent value="financial">
            <FinancialAnalysis
              periodStats={periodStats}
              chartData={chartData.monthly}
              period={selectedPeriod.label}
            />
          </TabsContent>

          {/* Analyse des produits */}
          <TabsContent value="products">
            <ProductAnalysis productPerformance={productPerformance} />
          </TabsContent>

          {/* Onglet Transactions (l'ancien contenu) */}
          <TabsContent value="transactions">
            <div className="space-y-6">
              {/* Statistiques de la période */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                    <Package className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(periodStats.revenue)}</div>
                    <p className="text-xs text-muted-foreground">{periodStats.quantitySold} unités vendues</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
                    <Package className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(periodStats.expenses)}</div>
                    <p className="text-xs text-muted-foreground">{periodStats.quantityPurchased} unités achetées</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bénéfice</CardTitle>
                    <TrendingUp className={`h-4 w-4 ${periodStats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${periodStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {periodStats.profit >= 0 ? '+' : '-'}{formatCurrency(periodStats.profit)}
                    </div>
                    <p className="text-xs text-muted-foreground">{periodStats.transactions} transaction(s)</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Marge brute</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{periodStats.grossMargin}%</div>
                    <Badge 
                      variant={periodStats.grossMargin >= 20 ? "default" : periodStats.grossMargin >= 10 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {periodStats.grossMargin >= 20 ? "Excellente" : 
                       periodStats.grossMargin >= 10 ? "Correcte" : "Faible"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filtres des transactions</CardTitle>
                  <CardDescription>
                    Affichage des {periodTransactions.length} transactions de la période
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rechercher par produit</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Nom du produit..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Type de transaction</label>
                      <Select 
                        value={filters.type} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="achat">Achats</SelectItem>
                          <SelectItem value="vente">Ventes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Liste des transactions</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} transaction(s) trouvée(s) dans la période
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Produit</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix unitaire</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {format(parseISO(transaction.created_at), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(transaction.created_at), 'HH:mm', { locale: fr })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.products.name}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={transaction.transaction_type === 'achat' ? 'default' : 'secondary'}
                              className={transaction.transaction_type === 'achat' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                            >
                              {transaction.transaction_type === 'achat' ? 'Achat' : 'Vente'}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.quantity}</TableCell>
                          <TableCell>{formatCurrency(transaction.price_per_unit)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Aucune transaction trouvée pour cette période
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Résumé */}
          <TabsContent value="summary">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Résumé financier détaillé */}
              <Card>
                <CardHeader>
                  <CardTitle>Résumé financier</CardTitle>
                  <CardDescription>{selectedPeriod.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Revenus totaux</span>
                      <span className="text-green-600 font-bold">{formatCurrency(periodStats.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Dépenses totales</span>
                      <span className="text-red-600 font-bold">{formatCurrency(periodStats.expenses)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Bénéfice net</span>
                      <span className={`font-bold ${periodStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {periodStats.profit >= 0 ? '+' : '-'}{formatCurrency(periodStats.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">Marge brute</span>
                      <span className="text-blue-600 font-bold">{periodStats.grossMargin}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">Nombre de transactions</span>
                      <span className="font-bold">{periodStats.transactions}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top 3 des produits */}
              <Card>
                <CardHeader>
                  <CardTitle>Top 3 des meilleures ventes</CardTitle>
                  <CardDescription>Par revenus générés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productPerformance.slice(0, 3).map((product, index) => (
                      <div key={product.productId} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.totalSold} unités vendues
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{formatCurrency(product.totalRevenue)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(product.averageSellingPrice)}/unité
                          </div>
                        </div>
                      </div>
                    ))}
                    {productPerformance.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune vente dans cette période
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;
