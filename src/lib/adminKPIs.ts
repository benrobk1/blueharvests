import { supabase } from '@/integrations/supabase/client';

export interface KPIData {
  households: number;
  householdsTrend: number;
  aov: number;
  onTimePercent: number;
  farmerShare: number;
  driverHourly: number;
  ordersPerRoute: number;
}

export async function fetchKPIs(): Promise<KPIData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Households: Distinct consumers with delivered orders in last 30 days
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('consumer_id, status, created_at')
    .eq('status', 'delivered')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { data: priorOrders } = await supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  const households = new Set(recentOrders?.map(o => o.consumer_id) || []).size;
  const priorHouseholds = new Set(priorOrders?.map(o => o.consumer_id) || []).size;
  const householdsTrend = priorHouseholds > 0 ? ((households - priorHouseholds) / priorHouseholds) * 100 : 0;

  // AOV: Average Order Value
  const { data: orderTotals } = await supabase
    .from('orders')
    .select('total_amount')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const totalRevenue = orderTotals?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
  const aov = orderTotals && orderTotals.length > 0 ? totalRevenue / orderTotals.length : 0;

  // On-Time Delivery %
  const { data: completedStops } = await supabase
    .from('batch_stops')
    .select('estimated_arrival, actual_arrival, status')
    .eq('status', 'delivered')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const onTimeCount = completedStops?.filter(stop => {
    if (!stop.estimated_arrival || !stop.actual_arrival) return false;
    return new Date(stop.actual_arrival) <= new Date(stop.estimated_arrival);
  }).length || 0;

  const onTimePercent = completedStops && completedStops.length > 0 
    ? (onTimeCount / completedStops.length) * 100 
    : 0;

  // Farmer Share %
  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount, recipient_type, order_id')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const farmerPayouts = payouts?.filter(p => p.recipient_type === 'farmer')
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const farmerShare = totalRevenue > 0 ? (farmerPayouts / totalRevenue) * 100 : 0;

  // Driver $/hr
  const { data: driverPayoutData } = await supabase
    .from('payouts')
    .select(`
      amount,
      order_id,
      orders!inner (
        delivery_batch_id
      )
    `)
    .eq('recipient_type', 'driver')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const totalDriverPay = driverPayoutData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Get batch durations
  const batchIds = [...new Set(driverPayoutData?.map(p => p.orders?.delivery_batch_id).filter(Boolean) || [])];
  const { data: batches } = await supabase
    .from('delivery_batches')
    .select('estimated_duration_minutes')
    .in('id', batchIds);

  const totalHours = batches?.reduce((sum, b) => sum + (b.estimated_duration_minutes / 60), 0) || 1;
  const driverHourly = totalHours > 0 ? totalDriverPay / totalHours : 0;

  // Orders per Route (Density)
  const { data: batchStops } = await supabase
    .from('batch_stops')
    .select('delivery_batch_id')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const batchStopCounts = batchStops?.reduce((acc, stop) => {
    acc[stop.delivery_batch_id] = (acc[stop.delivery_batch_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const stopCounts = Object.values(batchStopCounts);
  const ordersPerRoute = stopCounts.length > 0 
    ? stopCounts.reduce((sum, count) => sum + count, 0) / stopCounts.length 
    : 0;

  return {
    households,
    householdsTrend,
    aov,
    onTimePercent: Number(onTimePercent.toFixed(1)),
    farmerShare: Number(farmerShare.toFixed(1)),
    driverHourly: Number(driverHourly.toFixed(2)),
    ordersPerRoute: Number(ordersPerRoute.toFixed(1)),
  };
}
