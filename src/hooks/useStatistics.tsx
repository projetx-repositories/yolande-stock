
import { useMemo } from 'react';
import { useProducts } from './useProducts';
import { useTransactions } from './useTransactions';

export const useStatistics = () => {
  const { products } = useProducts();
  const { transactions } = useTransactions();

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock_quantity, 0);
    const lowStockProducts = products.filter(p => p.stock_quantity <= p.alert_threshold);

    const venteTransactions = transactions.filter(t => t.transaction_type === 'vente');

    const totalRevenue = venteTransactions.reduce((sum, t) => sum + t.total_amount, 0);

    const now = new Date();
    const monthlyRevenue = venteTransactions
      .filter(t => {
        const d = new Date(t.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.total_amount, 0);

    return {
      totalProducts,
      totalStock,
      lowStockProducts: lowStockProducts.length,
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
    };
  }, [products, transactions]);

  const chartData = useMemo(() => {
    if (transactions.length === 0) {
      return {
        transactionData: [],
        stockData: []
      };
    }

    const achatTransactions = transactions.filter(t => t.transaction_type === 'achat');
    const venteTransactions = transactions.filter(t => t.transaction_type === 'vente');

    const achatCount = achatTransactions.length;
    const venteCount = venteTransactions.length;

    const achatAmount = Math.round(achatTransactions.reduce((sum, t) => sum + t.total_amount, 0));
    const venteAmount = Math.round(venteTransactions.reduce((sum, t) => sum + t.total_amount, 0));

    const transactionData = [
      {
        name: "Achats",
        value: achatCount,
        amount: achatAmount,
        fill: "#ef4444"
      },
      {
        name: "Ventes", 
        value: venteCount,
        amount: venteAmount,
        fill: "#22c55e"
      }
    ];

    const stockData = products.map(product => ({
      name: product.name.length > 10 ? product.name.substring(0, 10) + '...' : product.name,
      stock: product.stock_quantity,
      alert: product.alert_threshold
    })).slice(0, 5);

    return {
      transactionData,
      stockData
    };
  }, [transactions, products]);

  return {
    stats,
    chartData
  };
};
