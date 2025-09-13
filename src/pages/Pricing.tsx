import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowLeft, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => { if (window.history.length > 1) navigate(-1); else navigate("/dashboard"); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Yolande Stock</span>
            </div>
          </div>
        </div>
      </header>

      {/* Coming Soon Section */}
      <section className="py-20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8">
              <Clock className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-6">
              Plans d'abonnement
            </h1>
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Bientôt disponible</CardTitle>
                <CardDescription className="text-center">
                  Nous préparons nos plans d'abonnement pour vous offrir la meilleure expérience.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  En attendant, vous pouvez utiliser toutes les fonctionnalités gratuitement.
                </p>
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Retour au tableau de bord
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
export default Pricing;