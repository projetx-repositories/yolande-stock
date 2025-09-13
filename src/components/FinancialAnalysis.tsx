import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { PeriodStats } from "@/hooks/useAnalytics";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";

interface FinancialAnalysisProps {
  periodStats: PeriodStats;
  chartData: {
    name: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  period: string;
}

export const FinancialAnalysis = ({ periodStats, chartData, period }: FinancialAnalysisProps) => {
  const formatCurrency = (value: number) => 
    `${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;

  const profitabilityColor = periodStats.profit >= 0 ? "text-green-600" : "text-red-600";
  const profitabilityIcon = periodStats.profit >= 0 ? TrendingUp : TrendingDown;
  const ProfitabilityIcon = profitabilityIcon;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenus */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(periodStats.revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodStats.quantitySold} unités vendues
            </p>
          </CardContent>
        </Card>

        {/* Dépenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(periodStats.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodStats.quantityPurchased} unités achetées
            </p>
          </CardContent>
        </Card>

        {/* Bénéfice */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bénéfice</CardTitle>
            <ProfitabilityIcon className={`h-4 w-4 ${profitabilityColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profitabilityColor}`}>
              {periodStats.profit >= 0 ? '+' : '-'}{formatCurrency(periodStats.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              {periodStats.transactions} transaction(s)
            </p>
          </CardContent>
        </Card>

        {/* Marge brute */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marge brute</CardTitle>
            <PieChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {periodStats.grossMargin}%
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge 
                variant={periodStats.grossMargin >= 20 ? "default" : periodStats.grossMargin >= 10 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {periodStats.grossMargin >= 20 ? "Excellente" : 
                 periodStats.grossMargin >= 10 ? "Correcte" : "Faible"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des revenus et dépenses */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution financière</CardTitle>
            <CardDescription>Revenus vs Dépenses - {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Revenus"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Dépenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bénéfices */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des bénéfices</CardTitle>
            <CardDescription>Profit/Perte - {period}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Bénéfice']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="profit" 
                  fill="hsl(var(--primary))"
                  name="Bénéfice"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};