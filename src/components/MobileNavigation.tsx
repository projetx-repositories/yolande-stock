
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Package, ShoppingCart, History, LogOut, Menu, Archive } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <div className="flex flex-col space-y-4 mt-8">
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => handleNavigation("/dashboard")}
            >
              <Archive className="h-4 w-4 mr-2" />
              Inventaires
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => handleNavigation("/add-product")}
            >
              <Package className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => handleNavigation("/transactions")}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Transactions
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={() => handleNavigation("/history")}
            >
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
