import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, TrendingUp, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FarmStoryModalProps {
  farmProfileId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FarmStoryModal = ({ farmProfileId, open, onOpenChange }: FarmStoryModalProps) => {
  const navigate = useNavigate();

  const { data: farmData } = useQuery({
    queryKey: ['farm-story', farmProfileId],
    queryFn: async () => {
      const { data: farm, error: farmError } = await supabase
        .from('farm_profiles')
        .select(`
          id,
          farm_name,
          description,
          bio,
          location,
          farmer_id,
          profiles!farm_profiles_farmer_id_fkey (
            avatar_url,
            full_name
          )
        `)
        .eq('id', farmProfileId)
        .single();

      if (farmError) throw farmError;

      // Fetch order count for impact metrics
      const { count: orderCount } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', farm.id);

      return {
        ...farm,
        orderCount: orderCount || 0,
      };
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Farm Story</DialogTitle>
        </DialogHeader>

        {farmData && (
          <div className="space-y-6">
            {/* Farmer Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={farmData.profiles?.avatar_url || ''} />
                <AvatarFallback>{farmData.farm_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{farmData.farm_name}</h3>
                <p className="text-muted-foreground">{farmData.profiles?.full_name}</p>
                {farmData.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {farmData.location}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {farmData.description && (
              <div>
                <h4 className="font-semibold mb-2">About the Farm</h4>
                <p className="text-muted-foreground">{farmData.description}</p>
              </div>
            )}

            {/* Bio */}
            {farmData.bio && (
              <div>
                <h4 className="font-semibold mb-2">Farmer's Story</h4>
                <p className="text-muted-foreground whitespace-pre-line">{farmData.bio}</p>
              </div>
            )}

            {/* Impact Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{farmData.orderCount}+</p>
                  <p className="text-sm text-muted-foreground">Orders Fulfilled</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">90%</p>
                  <p className="text-sm text-muted-foreground">Goes to Farmer</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              className="w-full"
              onClick={() => {
                navigate(`/farm/${farmProfileId}`);
                onOpenChange(false);
              }}
            >
              View Full Farm Profile
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
