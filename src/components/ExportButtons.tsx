import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FileSpreadsheet, Download } from "lucide-react";
import { useExports } from "@/hooks/useExports";
import { Transaction } from "@/hooks/useTransactions";
import { PeriodStats, ProductPerformance } from "@/hooks/useAnalytics";
import { toast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  transactions: Transaction[];
  periodStats: PeriodStats;
  productPerformance: ProductPerformance[];
  periodLabel: string;
}

export const ExportButtons = ({
  transactions,
  periodStats,
  productPerformance,
  periodLabel
}: ExportButtonsProps) => {
  const { exportTransactionsPDF, exportTransactionsExcel } = useExports();

  const handlePDFExport = () => {
    try {
      if (transactions.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucune transaction à exporter pour cette période",
          variant: "destructive"
        });
        return;
      }
      
      exportTransactionsPDF(transactions, periodStats, `Rapport ${periodLabel}`);
      toast({
        title: "Export PDF réussi",
        description: "Le rapport a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport PDF",
        variant: "destructive"
      });
    }
  };

  const handleExcelExport = () => {
    try {
      if (transactions.length === 0) {
        toast({
          title: "Aucune donnée",
          description: "Aucune transaction à exporter pour cette période",
          variant: "destructive"
        });
        return;
      }
      
      exportTransactionsExcel(transactions, periodStats, productPerformance, `Analyse ${periodLabel}`);
      toast({
        title: "Export Excel réussi", 
        description: "Le fichier d'analyse a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier Excel",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5 text-blue-500" />
          <span>Exports et rapports</span>
        </CardTitle>
        <CardDescription>
          Générez des rapports détaillés pour vos analyses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export PDF */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-red-500" />
              <span className="font-medium">Rapport PDF</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Rapport synthétique avec résumé financier et détail des transactions
            </p>
            <Button 
              onClick={handlePDFExport}
              variant="outline" 
              size="sm"
              className="w-full"
              disabled={transactions.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>

          {/* Export Excel */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-green-500" />
              <span className="font-medium">Analyse Excel</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Fichier complet avec données détaillées et performance des produits
            </p>
            <Button 
              onClick={handleExcelExport}
              variant="outline" 
              size="sm"
              className="w-full"
              disabled={transactions.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Télécharger Excel
            </Button>
          </div>
        </div>

        {transactions.length === 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              Aucune donnée disponible pour cette période
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};