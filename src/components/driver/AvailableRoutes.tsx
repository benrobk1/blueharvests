import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";

export function AvailableRoutes() {
  const { toast } = useToast();
  const { isDemoMode } = useDemoMode();
  
  // Demo batch data
  const demoBatch = {
    id: 'demo-batch-8',
    batch_number: 8,
    delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    status: 'pending',
    batch_stops: [{ count: 42 }]
  };

  const { data: availableBatches, refetch } = useQuery({
    queryKey: ['available-routes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('delivery_batches')
        .select(`
          id,
          batch_number,
          delivery_date,
          status,
          batch_stops (count)
        `)
        .eq('status', 'pending')
        .is('driver_id', null)
        .gte('delivery_date', new Date().toISOString().split('T')[0])
        .order('delivery_date', { ascending: true });
      
      return data;
    },
    enabled: !isDemoMode, // Don't fetch real data in demo mode
  });

  // Show demo data if in demo mode, otherwise show real data
  const displayBatches = isDemoMode ? [demoBatch] : availableBatches;
  
  const handleClaimRoute = async (batchId: string) => {
    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'In demo mode, route claiming is simulated. Sign up as a real driver to claim actual routes!',
      });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('delivery_batches')
      .update({ 
        driver_id: user.id,
        status: 'assigned'
      })
      .eq('id', batchId);
    
    if (error) {
      toast({
        title: 'Failed to claim route',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Route claimed!',
        description: 'Check your active route to begin deliveries',
      });
      refetch();
    }
  };
  
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Routes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!displayBatches || displayBatches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No available routes at this time. Check back later for new delivery batches.
          </p>
        ) : (
          displayBatches.map((batch) => (
            <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors">
              <div>
                <p className="font-medium text-foreground">Batch #{batch.batch_number}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(batch.delivery_date), 'EEEE, MMM dd, yyyy')}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {batch.batch_stops?.[0]?.count || 0} stops
                </Badge>
              </div>
              <Button onClick={() => handleClaimRoute(batch.id)}>
                Claim Route
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
