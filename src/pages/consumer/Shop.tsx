import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, MapPin, Package, User } from "lucide-react";
import logo from "@/assets/blue-harvests-logo.jpeg";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  available_quantity: number;
  image_url: string;
  farm_profile_id: string;
  farm_profiles: {
    id: string;
    farm_name: string;
  };
}

const Shop = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        farm_profiles!inner (
          id,
          farm_name
        )
      `)
      .gt("available_quantity", 0);

    if (error) {
      console.error("Error loading products:", error);
    } else {
      setProducts(data || []);
    }
    setIsLoading(false);
  };

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen bg-gradient-earth">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Blue Harvests" className="h-12 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Blue Harvests</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Delivering to ZIP 10001</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/consumer/profile")}>
                <User className="h-5 w-5 mr-2" />
                Profile
              </Button>
              <Button variant="outline" onClick={() => navigate("/consumer/orders")}>
                <Package className="h-5 w-5 mr-2" />
                Orders
              </Button>
              <Button className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for produce..."
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Products */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Farm Fresh Produce</h2>
          <p className="text-muted-foreground">
            90% of your purchase goes directly to the farmer
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading fresh produce...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-large transition-shadow">
                <div className="bg-gradient-hero p-8 text-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-32 object-cover rounded" />
                  ) : (
                    <div className="text-6xl mb-2">🌱</div>
                  )}
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{product.name}</h3>
                    <button
                      onClick={() => navigate(`/farm/${product.farm_profile_id}`)}
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      {product.farm_profiles.farm_name}
                    </button>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        ${product.price}
                        <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {product.available_quantity} available
                      </div>
                    </div>

                    <Button onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <Card className="mt-8 bg-primary text-primary-foreground p-6">
          <div className="grid gap-4 md:grid-cols-3 text-center">
            <div>
              <div className="text-2xl font-bold mb-1">$25</div>
              <div className="text-sm opacity-90">Minimum Order</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">$7.50</div>
              <div className="text-sm opacity-90">Delivery Fee (100% to Driver)</div>
            </div>
            <div>
              <div className="text-2xl font-bold mb-1">$10</div>
              <div className="text-sm opacity-90">Credit for $100+ Monthly Spend</div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Shop;
