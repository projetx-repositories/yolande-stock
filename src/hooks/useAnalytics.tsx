import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useTransactions, Transaction } from './useTransactions';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, isWithinInterval, parseISO, format, subDays, subWeeks, subMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface PeriodStats {
  revenue: number;
  expenses: number;
  profit: number;
  grossMargin: number;
  transactions: number;
  quantitySold: number;
  quantityPurchased: number;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averageSellingPrice: number;
  stockRotation: number;
  currentStock: number;
  alertThreshold: number;
  isLowStock: boolean;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'expense_anomaly' | 'revenue_drop';
  severity: 'low' | 'medium' | 'high';
  message: string;
  productId?: string;
  productName?: string;
  data?: any;
}

export const useAnalytics = () => {
  const { products } = useProducts();
  const { transactions } = useTransactions();

  // Générer les plages de dates
  const dateRanges = useMemo((): DateRange[] => {
    const now = new Date();
    return [
      {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Aujourd\'hui'
      },
      {
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
        label: 'Hier'
      },
      {
        start: startOfWeek(now, { locale: fr }),
        end: endOfWeek(now, { locale: fr }),
        label: 'Cette semaine'
      },
      {
        start: startOfWeek(subWeeks(now, 1), { locale: fr }),
        end: endOfWeek(subWeeks(now, 1), { locale: fr }),
        label: 'Semaine dernière'
      },
      {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'Ce mois'
      },
      {
        start: startOfMonth(subMonths(now, 1)),
        end: endOfMonth(subMonths(now, 1)),
        label: 'Mois dernier'
      },
      {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'Cette année'
      }
    ];
  }, []);

  // Filtrer les transactions par période
  const getTransactionsForPeriod = (start: Date, end: Date): Transaction[] => {
    return transactions.filter(transaction => {
      const transactionDate = parseISO(transaction.created_at);
      return isWithinInterval(transactionDate, { start, end });
    });
  };

  // Calculer les statistiques pour une période
  const getPeriodStats = (start: Date, end: Date): PeriodStats => {
    const periodTransactions = getTransactionsForPeriod(start, end);
    
    const sales = periodTransactions.filter(t => t.transaction_type === 'vente');
    const purchases = periodTransactions.filter(t => t.transaction_type === 'achat');

    const revenue = sales.reduce((sum, t) => sum + t.total_amount, 0);
    const expenses = purchases.reduce((sum, t) => sum + t.total_amount, 0);
    const profit = revenue - expenses;
    const grossMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const quantitySold = sales.reduce((sum, t) => sum + t.quantity, 0);
    const quantityPurchased = purchases.reduce((sum, t) => sum + t.quantity, 0);

    return {
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      profit: Math.round(profit),
      grossMargin: Math.round(grossMargin * 100) / 100,
      transactions: periodTransactions.length,
      quantitySold,
      quantityPurchased
    };
  };

  // Analyse des performances des produits
  const productPerformance = useMemo((): ProductPerformance[] => {
    return products.map(product => {
      const productSales = transactions.filter(
        t => t.product_id === product.id && t.transaction_type === 'vente'
      );

      const totalSold = productSales.reduce((sum, t) => sum + t.quantity, 0);
      const totalRevenue = productSales.reduce((sum, t) => sum + t.total_amount, 0);
      const averageSellingPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

      // Calcul de la rotation de stock (approximatif)
      const stockRotation = product.stock_quantity > 0 ? totalSold / product.stock_quantity : 0;

      return {
        productId: product.id,
        productName: product.name,
        totalSold,
        totalRevenue: Math.round(totalRevenue),
        averageSellingPrice: Math.round(averageSellingPrice),
        stockRotation: Math.round(stockRotation * 100) / 100,
        currentStock: product.stock_quantity,
        alertThreshold: product.alert_threshold,
        isLowStock: product.stock_quantity <= product.alert_threshold
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [products, transactions]);

  // Génération d'alertes
  const alerts = useMemo((): Alert[] => {
    const alertList: Alert[] = [];

    // Alertes de stock faible
    products.forEach(product => {
      if (product.stock_quantity <= product.alert_threshold) {
        alertList.push({
          id: `low_stock_${product.id}`,
          type: 'low_stock',
          severity: product.stock_quantity === 0 ? 'high' : 'medium',
          message: product.stock_quantity === 0 
            ? `Rupture de stock : ${product.name}`
            : `Stock faible : ${product.name} (${product.stock_quantity} ${product.unit_label} restant(s))`,
          productId: product.id,
          productName: product.name,
          data: { currentStock: product.stock_quantity, threshold: product.alert_threshold }
        });
      }
    });

    // Alerte de baisse de revenus (comparaison mois actuel vs mois précédent)
    const currentMonthStats = getPeriodStats(startOfMonth(new Date()), endOfMonth(new Date()));
    const lastMonthStats = getPeriodStats(startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1)));

    if (lastMonthStats.revenue > 0 && currentMonthStats.revenue < lastMonthStats.revenue * 0.8) {
      alertList.push({
        id: 'revenue_drop',
        type: 'revenue_drop',
        severity: 'high',
        message: `Baisse significative des revenus ce mois (-${Math.round(((lastMonthStats.revenue - currentMonthStats.revenue) / lastMonthStats.revenue) * 100)}%)`,
        data: { current: currentMonthStats.revenue, previous: lastMonthStats.revenue }
      });
    }

    // Anomalies de dépenses (dépenses exceptionnellement élevées)
    const avgMonthlyExpenses = transactions
      .filter(t => t.transaction_type === 'achat')
      .reduce((sum, t) => sum + t.total_amount, 0) / Math.max(1, Math.ceil(transactions.length / 30));

    if (currentMonthStats.expenses > avgMonthlyExpenses * 1.5) {
      alertList.push({
        id: 'expense_anomaly',
        type: 'expense_anomaly',
        severity: 'medium',
        message: `Dépenses élevées ce mois (${Math.round(((currentMonthStats.expenses - avgMonthlyExpenses) / avgMonthlyExpenses) * 100)}% au-dessus de la moyenne)`,
        data: { current: currentMonthStats.expenses, average: avgMonthlyExpenses }
      });
    }

    return alertList;
  }, [products, transactions]);

  // Données pour graphiques temporels
  const chartData = useMemo(() => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const stats = getPeriodStats(start, end);

      return {
        name: format(date, 'MMM yyyy', { locale: fr }),
        revenue: stats.revenue,
        expenses: stats.expenses,
        profit: stats.profit,
        month: format(date, 'yyyy-MM')
      };
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const start = startOfDay(date);
      const end = endOfDay(date);
      const stats = getPeriodStats(start, end);

      return {
        name: format(date, 'dd/MM', { locale: fr }),
        revenue: stats.revenue,
        expenses: stats.expenses,
        profit: stats.profit,
        date: format(date, 'yyyy-MM-dd')
      };
    });

    return {
      monthly: last12Months,
      daily: last30Days
    };
  }, [transactions]);

  return {
    dateRanges,
    getTransactionsForPeriod,
    getPeriodStats,
    productPerformance,
    alerts,
    chartData
  };
};