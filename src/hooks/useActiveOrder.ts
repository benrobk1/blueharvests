import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { POLLING_INTERVALS } from '@/config/ui-constants';

export const useActiveOrder = () => {
  const { user } = useAuth();

  const { data: activeOrder, isLoading, refetch } = useQuery({
    queryKey: ['active-order', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          delivery_date,
          box_code,
          order_items(
            quantity,
            products(name, unit)
          ),
          delivery_batches(
            driver_id,
            estimated_duration_minutes,
            profiles!delivery_batches_driver_id_fkey(full_name, phone)
          ),
          profiles!orders_consumer_id_fkey(street_address, city, state, zip_code)
        `)
        .eq('consumer_id', user?.id)
        .in('status', ['confirmed', 'in_transit', 'out_for_delivery'])
        .order('delivery_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: POLLING_INTERVALS.ACTIVE_ORDER,
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `consumer_id=eq.${user.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  return {
    activeOrder,
    isLoading,
  };
};
