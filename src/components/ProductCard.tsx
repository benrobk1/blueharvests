import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatMoney } from '@/lib/formatMoney';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, MapPin, Sprout, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { PriceBreakdownDrawer } from './PriceBreakdownDrawer';
import { LoadingButton } from './LoadingButton';
import { calculateDistance } from '@/lib/distanceHelpers';
import { FarmStoryModal } from './FarmStoryModal';
import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  available_quantity: number;
  image_url: string | null;
  farm_profile_id: string;
  harvest_date: string | null;
  farm_profiles: {
    id: string;
    farm_name: string;
    location: string | null;
  };
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showFarmStory, setShowFarmStory] = useState(false);

  // Get farmer info
  const { data: farmerData } = useQuery({
    queryKey: ['farmer', product.farm_profile_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('farm_profiles')
        .select(`
          farmer_id,
          profiles!farm_profiles_farmer_id_fkey (
            avatar_url,
            full_name
          )
        `)
        .eq('id', product.farm_profile_id)
        .single();
      return data;
    },
  });

  // Get consumer's zip code for distance calculation
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('zip_code')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Calculate distance from farm
  const milesFromFarm = product.farm_profiles.location && profile?.zip_code
    ? calculateDistance(product.farm_profiles.location, profile.zip_code)
    : null;

  const handleAddToCart = async () => {
    setIsAdding(true);
    await onAddToCart(product);
    setIsAdding(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
      {product.image_url && (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full aspect-video object-cover" 
          loading="lazy"
        />
      )}
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Avatar className="h-6 w-6">
              <AvatarImage src={farmerData?.profiles?.avatar_url || ''} />
              <AvatarFallback>
                <Sprout className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => navigate(`/farm/${product.farm_profile_id}`)}
              className="text-sm text-primary hover:underline"
            >
              {product.farm_profiles.farm_name}
            </button>
          </div>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {product.harvest_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(product.harvest_date), 'MMM d')}
            </div>
          )}
          {milesFromFarm && (
            <>
              {product.harvest_date && <span>•</span>}
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {milesFromFarm} mi
              </div>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFarmStory(true)}
          className="text-xs h-7 px-2"
        >
          Farm Story →
        </Button>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="text-xl font-bold">
              {formatMoney(product.price)}
              <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {product.available_quantity} available
            </div>
            <PriceBreakdownDrawer 
              price={product.price} 
              farmName={product.farm_profiles.farm_name}
            />
          </div>

          <LoadingButton 
            onClick={handleAddToCart}
            isLoading={isAdding}
            loadingText="Adding..."
            disabled={justAdded}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Added!
              </>
            ) : (
              'Add to Cart'
            )}
          </LoadingButton>
        </div>
      </CardContent>

      <FarmStoryModal
        farmProfileId={product.farm_profile_id}
        open={showFarmStory}
        onOpenChange={setShowFarmStory}
      />
    </Card>
  );
};
