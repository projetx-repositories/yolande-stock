import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Transaction } from './useTransactions';
import { PeriodStats, ProductPerformance } from './useAnalytics';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const useExports = () => {
  // Export PDF des transactions
  const exportTransactionsPDF = useCallback((
    transactions: Transaction[],
    periodStats: PeriodStats,
    title: string
  ) => {
    const doc = new jsPDF();

    // Titre
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text(`Généré le ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 20, 30);

    // Résumé financier
    doc.setFontSize(14);
    doc.text('Résumé de la période', 20, 45);
    doc.setFontSize(10);

    const summaryData = [
      ['Revenus', `${periodStats.revenue.toLocaleString('fr-FR')} FCFA`],
      ['Dépenses', `${periodStats.expenses.toLocaleString('fr-FR')} FCFA`],
      ['Bénéfice', `${periodStats.profit.toLocaleString('fr-FR')} FCFA`],
      ['Marge brute', `${periodStats.grossMargin}%`],
      ['Nombre de transactions', periodStats.transactions.toString()],
      ['Quantité vendue', `${periodStats.quantitySold} unités`],
      ['Quantité achetée', `${periodStats.quantityPurchased} unités`]
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Indicateur', 'Valeur']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });

    // Détail des transactions
    if (transactions.length > 0) {
      doc.setFontSize(14);
      doc.text('Détail des transactions', 20, (doc as any).lastAutoTable.finalY + 20);

      const transactionData = transactions.map(t => [
        format(new Date(t.created_at), 'dd/MM/yyyy', { locale: fr }),
        t.products.name,
        t.transaction_type === 'achat' ? 'Achat' : 'Vente',
        t.quantity.toString(),
        `${Math.round(t.price_per_unit).toLocaleString('fr-FR')} FCFA`,
        `${t.total_amount.toLocaleString('fr-FR')} FCFA`
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 30,
        head: [['Date', 'Produit', 'Type', 'Quantité', 'Prix unitaire', 'Total']],
        body: transactionData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] }
      });
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  }, []);

  // Export Excel des transactions
  const exportTransactionsExcel = useCallback((
    transactions: Transaction[],
    periodStats: PeriodStats,
    productPerformance: ProductPerformance[],
    title: string
  ) => {
    const workbook = XLSX.utils.book_new();

    // Feuille 1: Résumé
    const summaryData = [
      ['Indicateur', 'Valeur'],
      ['Période', title],
      ['Date de génération', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })],
      [''],
      ['Revenus', periodStats.revenue],
      ['Dépenses', periodStats.expenses],
      ['Bénéfice', periodStats.profit],
      ['Marge brute (%)', periodStats.grossMargin],
      ['Nombre de transactions', periodStats.transactions],
      ['Quantité vendue', periodStats.quantitySold],
      ['Quantité achetée', periodStats.quantityPurchased]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Résumé');

    // Feuille 2: Transactions
    if (transactions.length > 0) {
      const transactionData = [
        ['Date', 'Produit', 'Type', 'Quantité', 'Prix unitaire', 'Total'],
        ...transactions.map(t => [
          format(new Date(t.created_at), 'dd/MM/yyyy', { locale: fr }),
          t.products.name,
          t.transaction_type === 'achat' ? 'Achat' : 'Vente',
          t.quantity,
          Math.round(t.price_per_unit),
          t.total_amount
        ])
      ];

      const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');
    }

    // Feuille 3: Performance des produits
    if (productPerformance.length > 0) {
      const performanceData = [
        ['Produit', 'Quantité vendue', 'Revenus', 'Prix moyen', 'Rotation stock', 'Stock actuel', 'Seuil alerte'],
        ...productPerformance.map(p => [
          p.productName,
          p.totalSold,
          p.totalRevenue,
          p.averageSellingPrice,
          p.stockRotation,
          p.currentStock,
          p.alertThreshold
        ])
      ];

      const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance produits');
    }

    XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  }, []);

  return {
    exportTransactionsPDF,
    exportTransactionsExcel
  };
};