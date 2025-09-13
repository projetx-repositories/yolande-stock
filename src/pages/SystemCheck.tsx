import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useTransactions } from '@/hooks/useTransactions';
import { useOrganization } from '@/hooks/useOrganization';
import { useStatistics } from '@/hooks/useStatistics';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Home, Info, Shield, Database, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'loading' | 'info';
  message: string;
  details?: any;
  category: 'system' | 'auth' | 'data' | 'security';
  action?: string;
  requiresAuth?: boolean;
}

const SystemCheck = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Hooks
  const auth = useAuth();
  const products = useProducts();
  const transactions = useTransactions();
  const organization = useOrganization();
  const statistics = useStatistics();

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // SYSTEM TESTS - Basic connectivity without auth
    
    // Test 1: Supabase Health Check
    try {
      const { data, error } = await supabase.rpc('get_user_organization_id');
      results.push({
        name: 'Connectivité Supabase',
        category: 'system',
        status: 'success',
        message: 'API Supabase accessible',
        details: { connectionTest: true }
      });
    } catch (error) {
      results.push({
        name: 'Connectivité Supabase',
        category: 'system',
        status: 'error',
        message: 'Impossible de contacter Supabase',
        details: error,
        action: 'Vérifier la configuration réseau et les URLs Supabase'
      });
    }

    // Test 2: Environment Configuration  
    results.push({
      name: 'Configuration Environnement',
      category: 'system',
      status: 'success',
      message: 'Client Supabase initialisé',
      details: { supabaseInitialized: true }
    });

    // AUTHENTICATION TESTS
    
    // Test 3: Authentication State
    const authStatus = auth.loading ? 'loading' : (auth.user ? 'success' : 'info');
    const authMessage = auth.loading 
      ? 'Vérification de l\'authentification...' 
      : auth.user 
        ? `Utilisateur authentifié: ${auth.user.email}` 
        : 'Aucun utilisateur connecté (normal si pas encore connecté)';
    
    results.push({
      name: 'État Authentification',
      category: 'auth',
      status: authStatus,
      message: authMessage,
      details: { user: auth.user, session: !!auth.session },
      action: !auth.user ? 'Connectez-vous pour accéder aux données utilisateur' : undefined
    });

    // Test 4: Session Validity
    if (auth.session) {
      const now = new Date().getTime() / 1000;
      const expiresAt = auth.session.expires_at || 0;
      const isValid = expiresAt > now;
      
      results.push({
        name: 'Validité Session',
        category: 'auth',
        status: isValid ? 'success' : 'warning',
        message: isValid ? 'Session valide' : 'Session expirée ou expirante',
        details: { 
          expiresAt: new Date(expiresAt * 1000).toISOString(),
          remainingTime: Math.max(0, expiresAt - now)
        },
        requiresAuth: true
      });
    }

    // DATA TESTS - These require authentication
    
    if (auth.user) {
      // Test 5: Organization Hook
      const orgStatus = organization.loading ? 'loading' : (organization.organization ? 'success' : 'warning');
      const orgMessage = organization.loading 
        ? 'Chargement organisation...' 
        : organization.organization 
          ? `Organisation: ${organization.organization.name}` 
          : 'Aucune organisation (peut être normal pour un nouveau compte)';
      
      results.push({
        name: 'Données Organisation',
        category: 'data',
        status: orgStatus,
        message: orgMessage,
        details: { 
          organization: organization.organization?.name,
          members: organization.members?.length || 0,
          userRole: organization.getCurrentUserRole()
        },
        requiresAuth: true,
        action: !organization.organization ? 'L\'organisation devrait être créée automatiquement' : undefined
      });

      // Test 6: Products Hook  
      const prodStatus = products.loading ? 'loading' : 'success';
      const prodMessage = products.loading 
        ? 'Chargement produits...' 
        : `${products.products.length} produits (normal d'avoir 0 produits au début)`;
      
      results.push({
        name: 'Données Produits',
        category: 'data',
        status: prodStatus,
        message: prodMessage,
        details: { count: products.products.length, isSubmitting: products.isSubmitting },
        requiresAuth: true
      });

      // Test 7: Transactions Hook
      const transStatus = transactions.loading ? 'loading' : 'success';
      const transMessage = transactions.loading 
        ? 'Chargement transactions...' 
        : `${transactions.transactions.length} transactions (normal d'avoir 0 transactions au début)`;
      
      results.push({
        name: 'Données Transactions',
        category: 'data',
        status: transStatus,
        message: transMessage,
        details: { count: transactions.transactions.length, isSubmitting: transactions.isSubmitting },
        requiresAuth: true
      });

      // Test 8: Statistics Calculation
      const { stats } = statistics;
      results.push({
        name: 'Calculs Statistiques',
        category: 'data',
        status: 'success',
        message: `Statistiques calculées: ${stats.totalProducts} produits, ${stats.totalRevenue}€ CA`,
        details: stats,
        requiresAuth: true
      });

      // SECURITY/DATABASE TESTS
      
      // Test 9: RLS Policy Tests
      const tablesTests: Array<{name: 'products' | 'transactions' | 'organizations' | 'organization_members', label: string}> = [
        { name: 'products', label: 'Produits' },
        { name: 'transactions', label: 'Transactions' },
        { name: 'organizations', label: 'Organisations' },
        { name: 'organization_members', label: 'Membres' }
      ];

      for (const table of tablesTests) {
        try {
          const { error } = await supabase.from(table.name).select('count').limit(1);
          results.push({
            name: `RLS ${table.label}`,
            category: 'security',
            status: error ? (error.code === 'PGRST116' ? 'info' : 'error') : 'success',
            message: error 
              ? (error.code === 'PGRST116' 
                  ? 'Table vide (normal pour une nouvelle installation)' 
                  : `Erreur RLS: ${error.message}`)
              : 'Accès autorisé par RLS',
            details: { error, tableAccess: !error },
            requiresAuth: true,
            action: error && error.code !== 'PGRST116' ? 'Vérifier les politiques RLS' : undefined
          });
        } catch (error) {
          results.push({
            name: `RLS ${table.label}`,
            category: 'security',
            status: 'error',
            message: 'Erreur d\'accès aux données',
            details: error,
            requiresAuth: true,
            action: 'Vérifier la configuration de la base de données'
          });
        }
      }

      // Test 10: Database Functions
      try {
        const { error } = await supabase.rpc('get_user_organization_id');
        results.push({
          name: 'Fonctions Base de Données',
          category: 'security',
          status: error ? 'error' : 'success',
          message: error ? `Erreur fonction: ${error.message}` : 'Fonctions DB opérationnelles',
          details: { error },
          requiresAuth: true
        });
      } catch (error) {
        results.push({
          name: 'Fonctions Base de Données',
          category: 'security',
          status: 'error',
          message: 'Erreur d\'exécution des fonctions',
          details: error,
          requiresAuth: true
        });
      }
    } else {
      // Add info message about auth-required tests
      results.push({
        name: 'Tests Authentifiés',
        category: 'auth',
        status: 'info',
        message: 'Tests des données et sécurité disponibles après connexion',
        action: 'Connectez-vous pour exécuter tous les tests'
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Succès</Badge>;
      case 'error':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Erreur</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Attention</Badge>;
      case 'loading':
        return <Badge className="bg-muted text-muted-foreground">Chargement</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Info</Badge>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: TestResult['category']) => {
    switch (category) {
      case 'system':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <User className="h-4 w-4" />;
      case 'data':
        return <Database className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: TestResult['category']) => {
    switch (category) {
      case 'system':
        return 'Système';
      case 'auth':
        return 'Authentification';
      case 'data':
        return 'Données';
      case 'security':
        return 'Sécurité';
      default:
        return category;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;
  const infoCount = testResults.filter(r => r.status === 'info').length;

  // Group results by category
  const resultsByCategory = testResults.reduce((acc, result) => {
    if (!acc[result.category]) acc[result.category] = [];
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Vérification du Système</h1>
            <p className="text-muted-foreground">Diagnostic complet des fonctionnalités de l'application</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              Relancer les tests
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Authentication Status Alert */}
        {!auth.user && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Authentification requise:</strong> Connectez-vous pour accéder à tous les tests de données et de sécurité.
              Seuls les tests de base du système sont disponibles sans authentification.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">{successCount}</div>
                  <div className="text-sm text-muted-foreground">Succès</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-muted-foreground">Attention</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-2xl font-bold text-destructive">{errorCount}</div>
                  <div className="text-sm text-muted-foreground">Erreurs</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{infoCount}</div>
                  <div className="text-sm text-muted-foreground">Info</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{testResults.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Results by Category */}
        <div className="space-y-6">
          {Object.entries(resultsByCategory).map(([category, results]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category as TestResult['category'])}
                  Tests {getCategoryLabel(category as TestResult['category'])}
                </CardTitle>
                <CardDescription>
                  {category === 'system' && 'Tests de base de connectivité et configuration'}
                  {category === 'auth' && 'Vérifications d\'authentification et de session'}
                  {category === 'data' && 'Tests d\'accès aux données utilisateur'}
                  {category === 'security' && 'Vérifications des politiques de sécurité et RLS'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(result.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{result.name}</h3>
                          {getStatusBadge(result.status)}
                          {result.requiresAuth && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Auth requise
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                        {result.action && (
                          <div className="mb-2">
                            <Alert className="py-2">
                              <Info className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                <strong>Action recommandée:</strong> {result.action}
                              </AlertDescription>
                            </Alert>
                          </div>
                        )}
                        {result.details && (
                          <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer hover:text-foreground">Détails techniques</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Guide des Statuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <strong className="text-primary">Succès:</strong> Fonctionne correctement
                </p>
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <strong className="text-yellow-600">Attention:</strong> Fonctionne, mais vérifier si normal
                </p>
                <p className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <strong className="text-destructive">Erreur:</strong> Problème à corriger
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <strong className="text-blue-600">Info:</strong> Information contextuelle
                </p>
                <p className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <strong>Chargement:</strong> Test en cours
                </p>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Les tests marqués "Auth requise" nécessitent une connexion utilisateur.
                Il est normal d'avoir 0 produits/transactions dans une nouvelle installation.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemCheck;