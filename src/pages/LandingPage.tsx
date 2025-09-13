import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingUp, History, Users, Check, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
const LandingPage = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();

  // SEO: landing page metadata
  useEffect(() => {
    document.title = "Yolande Stock — Gestion de stock intelligente";
    const desc = "Gérez vos stocks, ventes et rapports. Simple, puissant, accessible.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.origin + "/");
    const ld = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Yolande Stock",
      url: window.location.origin + "/",
      potentialAction: {
        "@type": "SearchAction",
        target: window.location.origin + "/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    let ldEl = document.getElementById("ld-website") as HTMLScriptElement | null;
    if (!ldEl) {
      ldEl = document.createElement("script") as HTMLScriptElement;
      ldEl.id = "ld-website";
      ldEl.type = "application/ld+json";
      document.head.appendChild(ldEl);
    }
    ldEl.textContent = JSON.stringify(ld);
  }, []);
  const features = [{
    icon: Package,
    title: "Gestion de stock intelligente",
    description: "Suivez vos stocks en temps réel avec des alertes automatiques"
  }, {
    icon: TrendingUp,
    title: "Analyses avancées",
    description: "Tableaux de bord et rapports détaillés pour optimiser votre business"
  }, {
    icon: History,
    title: "Historique complet",
    description: "Accès à l'historique de toutes vos transactions et mouvements"
  }, {
    icon: Users,
    title: "Gestion d'équipe",
    description: "Collaborez avec votre équipe et gérez les permissions"
  }];
  const plans = [{
    name: "Gratuit",
    price: "0",
    description: "Parfait pour commencer",
    features: ["Jusqu'à 50 produits", "100 transactions/mois", "Rapports de base", "Support email"],
    cta: "Commencer gratuitement",
    popular: false
  }, {
    name: "Premium",
    price: "29",
    description: "Pour les entreprises en croissance",
    features: ["Produits illimités", "Transactions illimitées", "Rapports avancés", "Gestion d'équipe", "Support prioritaire", "Intégrations API"],
    cta: "Essayer Premium",
    popular: true
  }, {
    name: "Enterprise",
    price: "99",
    description: "Pour les grandes organisations",
    features: ["Tout du Premium", "Déploiement sur site", "Support dédié 24/7", "Formations personnalisées", "SLA garanti"],
    cta: "Contactez-nous",
    popular: false
  }];
  const testimonials = [{
    name: "Marie Dubois",
    company: "Restaurant Le Gourmet",
    content: "Yolande Stock a révolutionné notre gestion d'inventaire. Nous économisons 3h par semaine !",
    rating: 5
  }, {
    name: "Jean Martin",
    company: "Cave à Vins Premium",
    content: "Interface intuitive et rapports détaillés. Parfait pour notre activité.",
    rating: 5
  }, {
    name: "Sophie Laurent",
    company: "Épicerie Bio Nature",
    content: "Les alertes de stock nous évitent les ruptures. Service client au top !",
    rating: 5
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Yolande Stock</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? <Button onClick={() => navigate("/dashboard")}>
                Tableau de bord
              </Button> : <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Connexion
                </Button>
                <Button onClick={() => navigate("/auth")}>
                  Essayer gratuitement
                </Button>
              </>}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--hero-gradient-from))_0%,transparent_60%)] opacity-30" />
        </div>
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <h1 className="font-playfair text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Gérez votre stock comme un{" "}
              <span className="bg-gradient-to-r from-[hsl(var(--hero-gradient-from))] to-[hsl(var(--hero-gradient-to))] bg-clip-text text-transparent">
                pro
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              La solution complète pour gérer vos stocks, suivre vos ventes et développer votre business. 
              Simple, puissant et accessible partout.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth")} className="hover-scale bg-primary hover:bg-primary/90">
                {user ? "Aller au tableau de bord" : "Commencer gratuitement"}
              </Button>
              <Button size="lg" variant="outline" className="hover-scale">
                Voir la démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Des fonctionnalités puissantes pour simplifier votre gestion quotidienne
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => <Card key={index} className="text-center hover-scale transition-shadow hover:shadow-lg animate-fade-in">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-[hsl(var(--feature-accent))] mx-auto mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Choisissez votre plan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Des prix transparents qui s'adaptent à votre croissance
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {plans.map((plan, index) => <Card key={index} className={`relative hover-scale transition-shadow hover:shadow-lg ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[hsl(var(--pricing-highlight))] text-black px-3 py-1 rounded-full text-sm font-medium">
                      Le plus populaire
                    </span>
                  </div>}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} onClick={() => navigate(user ? "/dashboard" : "/auth")}>
                    {user ? "Aller au tableau de bord" : plan.cta}
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      

      {/* CTA Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Prêt à transformer votre gestion de stock ?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Rejoignez des milliers d'entreprises qui font confiance à Yolande Stock
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth")} className="bg-primary hover:bg-primary/90">
                {user ? "Aller au tableau de bord" : "Commencer maintenant - C'est gratuit"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container px-4 md:px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Yolande Stock</span>
              </div>
              <p className="text-sm text-muted-foreground">
                La solution de gestion de stock qui simplifie votre quotidien.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-foreground">Tarifs</a></li>
                <li><a href="#" className="hover:text-foreground">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">À propos</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Carrières</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Statut</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Yolande Stock. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;