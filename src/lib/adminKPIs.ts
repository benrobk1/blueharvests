import { supabase } from '@/integrations/supabase/client';

export interface KPIData {
  households: number;
  householdsTrend: number;
  aov: number;
  onTimePercent: number;
  farmerShare: number;
  driverHourly: number;
  ordersPerRoute: number;
  churnRate: number;
}

export async function fetchKPIs(demoModeActive: boolean = false): Promise<KPIData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Step 1: Get demo/non-demo profile IDs
  let demoFilterIds: string[] = [];
  if (demoModeActive) {
    const { data: demoProfiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', '%@demo.com');
    demoFilterIds = demoProfiles?.map(p => p.id) || [];
  } else {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email');
    demoFilterIds = allProfiles?.filter(p => !p.email.endsWith('@demo.com')).map(p => p.id) || [];
  }

  if (demoFilterIds.length === 0) {
    // No matching profiles, return zeros
    return {
      households: 0, householdsTrend: 0, aov: 0, onTimePercent: 0,
      farmerShare: 0, driverHourly: 0, ordersPerRoute: 0, churnRate: 0,
    };
  }

  // Households: Distinct consumers with delivered orders in last 30 days
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('consumer_id, status, created_at')
    .eq('status', 'delivered')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('consumer_id', demoFilterIds);

  const { data: priorOrders } = await supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())
    .in('consumer_id', demoFilterIds);

  const households = new Set(recentOrders?.map(o => o.consumer_id) || []).size;
  const priorHouseholds = new Set(priorOrders?.map(o => o.consumer_id) || []).size;
  const householdsTrend = priorHouseholds > 0 ? ((households - priorHouseholds) / priorHouseholds) * 100 : 0;

  // Monthly Churn: Calculate consumers who ordered last month but not this month
  const lastMonthStart = new Date();
  lastMonthStart.setDate(1); // First day of current month
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); // First day of last month
  
  const lastMonthEnd = new Date();
  lastMonthEnd.setDate(1); // First day of current month
  
  const { data: lastMonthOrders } = await supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', lastMonthStart.toISOString())
    .lt('created_at', lastMonthEnd.toISOString())
    .in('consumer_id', demoFilterIds);
  
  const { data: currentMonthOrders } = await supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', lastMonthEnd.toISOString())
    .in('consumer_id', demoFilterIds);
  
  const lastMonthSet = new Set(lastMonthOrders?.map(o => o.consumer_id) || []);
  const currentMonthSet = new Set(currentMonthOrders?.map(o => o.consumer_id) || []);
  
  const lostCustomers = Array.from(lastMonthSet).filter(
    id => !currentMonthSet.has(id)
  ).length;
  
  const churnRate = lastMonthSet.size > 0 
    ? (lostCustomers / lastMonthSet.size) * 100 
    : 0;

  // AOV: Average Order Value
  const { data: orderTotals } = await supabase
    .from('orders')
    .select('total_amount, id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('consumer_id', demoFilterIds);

  const totalRevenue = orderTotals?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
  const aov = orderTotals && orderTotals.length > 0 ? totalRevenue / orderTotals.length : 0;
  const demoOrderIds = orderTotals?.map(o => o.id) || [];

  // On-Time Delivery %
  const { data: completedStops } = await supabase
    .from('batch_stops')
    .select('estimated_arrival, actual_arrival, status, order_id')
    .eq('status', 'delivered')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('order_id', demoOrderIds.length > 0 ? demoOrderIds : ['00000000-0000-0000-0000-000000000000']);

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
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('order_id', demoOrderIds.length > 0 ? demoOrderIds : ['00000000-0000-0000-0000-000000000000']);

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
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('order_id', demoOrderIds.length > 0 ? demoOrderIds : ['00000000-0000-0000-0000-000000000000']);

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
    .select('delivery_batch_id, order_id')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in('order_id', demoOrderIds.length > 0 ? demoOrderIds : ['00000000-0000-0000-0000-000000000000']);

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
    churnRate: Number(churnRate.toFixed(1)),
  };
}
