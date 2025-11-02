import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const LiveMap = () => {
  const navigate = useNavigate();
  
  const { data: activeBatches, isLoading } = useQuery({
    queryKey: ['live-demo-batches'],
    queryFn: async () => {
      const { data: batches } = await supabase
        .from('delivery_batches')
        .select(`
          id,
          batch_number,
          status,
          profiles!delivery_batches_driver_id_fkey (
            full_name
          )
        `)
        .in('status', ['in_progress', 'assigned'])
        .order('batch_number');

      if (!batches) return [];

      const batchesWithStops = await Promise.all(
        batches.map(async (batch) => {
          const { data: stops } = await supabase
            .from('driver_batch_stops_secure')
            .select('id, sequence_number, status, latitude, longitude, estimated_arrival')
            .eq('delivery_batch_id', batch.id)
            .order('sequence_number');

          return {
            ...batch,
            stops: stops || [],
          };
        })
      );

      return batchesWithStops;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for "live" feel
  });

  // Simulate driver position interpolation
  const getDriverPosition = (stops: any[]) => {
    if (!stops || stops.length === 0) return null;
    
    const now = new Date();
    const completedStops = stops.filter(s => s.status === 'delivered');
    const nextStop = stops.find(s => s.status === 'pending' || s.status === 'in_progress');
    
    if (!nextStop || completedStops.length === 0) {
      return stops[0]; // At first stop
    }

    const lastCompleted = completedStops[completedStops.length - 1];
    
    // Interpolate between last completed and next stop
    const progress = 0.3 + (Math.random() * 0.4); // Simulate 30-70% progress
    
    return {
      latitude: lastCompleted.latitude + (nextStop.latitude - lastCompleted.latitude) * progress,
      longitude: lastCompleted.longitude + (nextStop.longitude - lastCompleted.longitude) * progress,
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-earth p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-earth">
      <header className="bg-white border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Live Delivery Map</h1>
              <p className="text-sm text-muted-foreground">Real-time driver tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Active Routes
              </CardTitle>
              <Badge variant="default" className="bg-success">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!activeBatches || activeBatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active deliveries</p>
            ) : (
              <div className="space-y-6">
                {activeBatches.map((batch) => {
                  const driverPos = getDriverPosition(batch.stops);
                  const deliveredCount = batch.stops.filter((s: any) => s.status === 'delivered').length;
                  const totalStops = batch.stops.length;

                  return (
                    <div key={batch.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {batch.profiles?.full_name || 'Unknown Driver'} - Batch #{batch.batch_number}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {deliveredCount} of {totalStops} stops completed
                          </p>
                        </div>
                        <Badge variant={batch.status === 'in_progress' ? 'default' : 'secondary'}>
                          {batch.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                        </Badge>
                      </div>

                      {/* Uber-style Map Visualization */}
                      <div className="relative w-full h-64 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg border overflow-hidden">
                        {/* Driver icon (moving truck) */}
                        {driverPos && (
                          <div 
                            className="absolute w-8 h-8 bg-earth rounded-full shadow-lg flex items-center justify-center transition-all duration-1000 z-20"
                            style={{
                              left: '45%',
                              top: '45%',
                              animation: 'pulse 2s ease-in-out infinite'
                            }}
                          >
                            <Truck className="h-5 w-5 text-white" />
                          </div>
                        )}
                        
                        {/* Drop-off location pins */}
                        {batch.stops.map((stop: any, idx: number) => {
                          const x = 15 + (idx % 8) * 11;
                          const y = 15 + Math.floor(idx / 8) * 25 + (Math.random() * 5);
                          
                          return (
                            <div
                              key={stop.id}
                              className="absolute transition-all duration-500"
                              style={{ left: `${x}%`, top: `${y}%` }}
                            >
                              <MapPin 
                                className={`h-6 w-6 ${
                                  stop.status === 'delivered' 
                                    ? 'text-success fill-success/20' 
                                    : stop.status === 'in_progress'
                                    ? 'text-primary fill-primary/20 animate-bounce'
                                    : 'text-muted-foreground fill-muted/20'
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-success" />
                          <span>Delivered</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                          <span>In Progress</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-muted" />
                          <span>Pending</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">🚚</span>
                          <span>Driver</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LiveMap;
