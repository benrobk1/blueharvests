import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Truck, Sprout, BarChart3 } from "lucide-react";
import logo from "@/assets/blue-harvests-logo.jpeg";

const Index = () => {
  const navigate = useNavigate();

  const consumerOption = {
    id: "consumer",
    title: "Shop from Farmers",
    description: "Access locally grown, organic produce delivered fresh to your door",
    icon: Users,
    color: "primary",
    route: "/auth/consumer",
  };

  const partnerOptions = [
    {
      id: "driver",
      title: "Earn as a Driver",
      description: "Join our delivery network and earn 100% of delivery fees plus tips",
      icon: Truck,
      color: "secondary",
      route: "/auth/driver",
    },
    {
      id: "farmer",
      title: "Sell Your Harvest",
      description: "Keep 90% of your sales and connect directly with local customers",
      icon: Sprout,
      color: "earth",
      route: "/auth/farmer",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-hero">
        <div className="w-full">
          <img 
            src={logo} 
            alt="Blue Harvests - Family Farm Fresh, Locally Traceable, Climate Friendly" 
            className="w-full h-auto object-cover" 
            loading="lazy"
            width="1200"
            height="400"
          />
        </div>
        <div className="container mx-auto max-w-6xl text-center py-8 px-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-white/90 text-sm">90% to Farmers • 100% of Fees to Drivers</div>
          </div>
        </div>
      </header>

      {/* Main Consumer Option */}
      <section className="container mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold text-foreground">
          Fresh from Local Farms
        </h2>
        
        {/* Featured Consumer Card */}
        <Card
          className="group relative overflow-hidden border-4 border-primary hover:border-primary/80 transition-all duration-300 hover:shadow-large cursor-pointer mb-12"
          onClick={() => navigate(consumerOption.route)}
        >
          <div className="p-8 space-y-6 text-center">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 mx-auto">
              <Users className="h-10 w-10" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {consumerOption.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {consumerOption.description}
              </p>
            </div>

            <Button
              className="w-full max-w-md mx-auto group-hover:shadow-medium transition-shadow"
              size="lg"
            >
              Start Shopping
            </Button>
          </div>
        </Card>

        {/* Partner Options - More Discreet */}
        <div className="space-y-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground">
            Join Our Network
          </h3>
          <div className="grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
            {partnerOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card
                  key={option.id}
                  className="group relative overflow-hidden border hover:border-muted-foreground/50 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(option.route)}
                >
                  <div className="p-4 space-y-3">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-${option.color}/10 text-${option.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    <div>
                      <h4 className="text-base font-semibold text-foreground mb-1">
                        {option.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      variant="ghost"
                      size="sm"
                    >
                      Learn More
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="bg-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-12 text-center">
            <div>
              <div className="mb-4 text-4xl font-bold text-primary">90%</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Direct to Farmers</h3>
              <p className="text-sm text-muted-foreground">
                Farmers keep 90% of product prices, far above wholesale rates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-12 px-4 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-6">
            <h3 className="mb-2 text-2xl font-bold">Blue Harvests</h3>
            <p className="text-white/70 text-sm">
              Family Farm Fresh • Locally Traceable • Climate Friendly
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth/admin")}
              className="text-white/50 hover:text-white/70 text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Staff Portal
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
