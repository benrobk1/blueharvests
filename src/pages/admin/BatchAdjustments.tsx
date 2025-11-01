import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BatchAdjustments = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ['admin-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select(`
          *,
          profiles!delivery_batches_driver_id_fkey(full_name),
          batch_stops(id, status),
          batch_metadata(
            collection_point_id,
            collection_point_address,
            order_count,
            is_subsidized,
            merged_zips,
            estimated_route_hours
          )
        `)
        .order('delivery_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');

      if (error) throw error;

      const driverProfiles = await Promise.all(
        (data || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', role.user_id)
            .single();
          return profile;
        })
      );

      return driverProfiles.filter(Boolean);
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async ({ batchId, driverId }: { batchId: string; driverId: string }) => {
      const { error } = await supabase
        .from('delivery_batches')
        .update({ driver_id: driverId })
        .eq('id', batchId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Batch reassigned',
        description: 'The delivery batch has been reassigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-batches'] });
      setSelectedBatch(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'assigned':
        return <Badge>Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Batch Adjustments</h1>
          <p className="text-muted-foreground">Manually adjust delivery batches and reassign drivers</p>
        </div>
      </div>

      <div className="space-y-4">
        {batches && batches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No delivery batches found
            </CardContent>
          </Card>
        ) : (
          batches?.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Batch #{batch.batch_number}
                    </CardTitle>
                    <CardDescription>
                      {batch.profiles?.full_name || 'Unassigned'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(batch.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {batch.batch_metadata && batch.batch_metadata.length > 0 && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Collection Point</p>
                      {batch.batch_metadata[0].is_subsidized && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Subsidized
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {batch.batch_metadata[0].collection_point_address || 'Not assigned'}
                    </p>
                    {batch.batch_metadata[0].merged_zips && batch.batch_metadata[0].merged_zips.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Merged ZIPs: {batch.batch_metadata[0].merged_zips.join(', ')}
                      </p>
                    )}
                    {batch.batch_metadata[0].estimated_route_hours && (
                      <p className="text-xs text-muted-foreground">
                        Est. Route: {Number(batch.batch_metadata[0].estimated_route_hours).toFixed(1)} hours
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Orders: {batch.batch_metadata[0].order_count}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Delivery Date
                    </p>
                    <p className="font-medium">
                      {new Date(batch.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Stops</p>
                    <p className="font-medium">{batch.batch_stops?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ZIP Codes</p>
                    <p className="font-medium">{batch.zip_codes?.join(', ') || 'N/A'}</p>
                  </div>
                </div>

                {batch.status !== 'completed' && (
                  <div className="pt-4 border-t space-y-3">
                    <Label>Reassign Driver</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedBatch === batch.id ? undefined : ''}
                        onValueChange={(driverId) => {
                          setSelectedBatch(batch.id);
                          reassignMutation.mutate({ batchId: batch.id, driverId });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select new driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers?.map((driver) => (
                            <SelectItem key={driver?.id} value={driver?.id || ''}>
                              {driver?.full_name} ({driver?.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchAdjustments;
