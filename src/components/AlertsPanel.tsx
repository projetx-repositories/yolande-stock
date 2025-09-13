import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert as AlertComponent, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, AlertCircle, TrendingDown, Package, X } from "lucide-react";
import { Alert } from "@/hooks/useAnalytics";
import { useState } from "react";

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.includes(alert.id));

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'low_stock':
        return Package;
      case 'revenue_drop':
        return TrendingDown;
      case 'expense_anomaly':
        return AlertCircle;
      default:
        return AlertTriangle;
    }
  };

  const getAlertVariant = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'Critique';
      case 'medium':
        return 'Important';
      case 'low':
        return 'Information';
      default:
        return 'Information';
    }
  };

  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-500" />
            <span>Alertes et contrôle</span>
          </CardTitle>
          <CardDescription>
            Surveillance automatique de votre activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-medium">Tout va bien !</p>
            <p className="text-sm text-muted-foreground">
              Aucune alerte en cours. Votre business fonctionne normalement.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Alertes et contrôle</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {visibleAlerts.length} alerte(s)
          </Badge>
        </CardTitle>
        <CardDescription>
          Surveillance automatique de votre activité
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const severityClass = getSeverityColor(alert.severity);
            
            return (
              <AlertComponent
                key={alert.id}
                className={`${severityClass} relative`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start space-x-3">
                    <Icon className="h-4 w-4 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <AlertDescription className="font-medium">
                          {alert.message}
                        </AlertDescription>
                        <Badge 
                          variant={getAlertVariant(alert.severity)}
                          className="text-xs"
                        >
                          {getSeverityLabel(alert.severity)}
                        </Badge>
                      </div>
                      
                      {/* Informations supplémentaires selon le type d'alerte */}
                      {alert.type === 'low_stock' && alert.data && (
                        <div className="text-xs text-muted-foreground">
                          Stock actuel: {alert.data.currentStock} | 
                          Seuil d'alerte: {alert.data.threshold}
                        </div>
                      )}
                      
                      {alert.type === 'revenue_drop' && alert.data && (
                        <div className="text-xs text-muted-foreground">
                          Revenus actuels: {alert.data.current.toLocaleString('fr-FR')} FCFA | 
                          Mois précédent: {alert.data.previous.toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                      
                      {alert.type === 'expense_anomaly' && alert.data && (
                        <div className="text-xs text-muted-foreground">
                          Dépenses actuelles: {alert.data.current.toLocaleString('fr-FR')} FCFA | 
                          Moyenne: {alert.data.average.toLocaleString('fr-FR')} FCFA
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0 hover:bg-white/50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </AlertComponent>
            );
          })}
        </div>

        {/* Résumé par gravité */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Répartition:</span>
            <div className="flex space-x-4">
              {['high', 'medium', 'low'].map((severity) => {
                const count = visibleAlerts.filter(a => a.severity === severity).length;
                if (count === 0) return null;
                
                return (
                  <div key={severity} className="flex items-center space-x-1">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        severity === 'high' ? 'bg-red-500' :
                        severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-xs">
                      {count} {getSeverityLabel(severity as Alert['severity']).toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};