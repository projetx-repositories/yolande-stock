import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, History, ShoppingCart, LogOut, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStatistics } from "@/hooks/useStatistics";
import TransactionChart from "@/components/TransactionChart";
import StockChart from "@/components/StockChart";
import MobileNavigation from "@/components/MobileNavigation";

const DashboardMain = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { stats, chartData } = useStatistics();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Yolande Stock</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-4">
              <Button variant="ghost" onClick={() => navigate("/")}>
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
              <Button variant="ghost" onClick={() => navigate("/add-product")}>
                <Package className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
              <Button onClick={() => navigate("/inventory")} variant="ghost">
                <Package className="h-4 w-4 mr-2" />
                Inventaire
              </Button>
              <Button variant="ghost" onClick={() => navigate("/transactions")}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Transactions
              </Button>
              <Button variant="ghost" onClick={() => navigate("/history")}>
                <History className="h-4 w-4 mr-2" />
                Historique
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h2>
          <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble de votre stock et activités récentes</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Produits totaux</CardTitle>
              <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">articles différents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Stock total</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalStock}</div>
              <p className="text-xs text-muted-foreground">bouteilles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Alertes stock</CardTitle>
              <Package className={`h-3 w-3 sm:h-4 sm:w-4 ${stats.lowStockProducts > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-lg sm:text-2xl font-bold ${stats.lowStockProducts > 0 ? 'text-red-600' : ''}`}>
                {stats.lowStockProducts}
              </div>
              <p className="text-xs text-muted-foreground">produits en rupture</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">CA total</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground">FCFA</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <TransactionChart data={chartData.transactionData} />
          <StockChart data={chartData.stockData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardMain;