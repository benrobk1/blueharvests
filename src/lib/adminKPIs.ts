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

  // Build query to filter based on demo mode
  const buildOrderQuery = (query: any) => {
    if (demoModeActive) {
      // When demo mode is ON, ONLY show demo users
      return query.in('consumer_id', `(
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
      )`);
    } else {
      // When demo mode is OFF, exclude demo users
      return query.not('consumer_id', 'in', `(
        SELECT id FROM profiles WHERE email LIKE '%@demo.com'
      )`);
    }
  };

  // Households: Distinct consumers with delivered orders in last 30 days
  let recentOrdersQuery = supabase
    .from('orders')
    .select('consumer_id, status, created_at')
    .eq('status', 'delivered')
    .gte('created_at', thirtyDaysAgo.toISOString());
  
  const { data: recentOrders } = await buildOrderQuery(recentOrdersQuery);

  let priorOrdersQuery = supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());
    
  const { data: priorOrders } = await buildOrderQuery(priorOrdersQuery);

  const households = new Set(recentOrders?.map(o => o.consumer_id) || []).size;
  const priorHouseholds = new Set(priorOrders?.map(o => o.consumer_id) || []).size;
  const householdsTrend = priorHouseholds > 0 ? ((households - priorHouseholds) / priorHouseholds) * 100 : 0;

  // Monthly Churn: Calculate consumers who ordered last month but not this month
  const lastMonthStart = new Date();
  lastMonthStart.setDate(1); // First day of current month
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1); // First day of last month
  
  const lastMonthEnd = new Date();
  lastMonthEnd.setDate(1); // First day of current month
  
  let lastMonthOrdersQuery = supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', lastMonthStart.toISOString())
    .lt('created_at', lastMonthEnd.toISOString());
    
  const { data: lastMonthOrders } = await buildOrderQuery(lastMonthOrdersQuery);
  
  let currentMonthOrdersQuery = supabase
    .from('orders')
    .select('consumer_id')
    .eq('status', 'delivered')
    .gte('created_at', lastMonthEnd.toISOString());
    
  const { data: currentMonthOrders } = await buildOrderQuery(currentMonthOrdersQuery);
  
  const lastMonthSet = new Set(lastMonthOrders?.map(o => o.consumer_id) || []);
  const currentMonthSet = new Set(currentMonthOrders?.map(o => o.consumer_id) || []);
  
  const lostCustomers = Array.from(lastMonthSet).filter(
    id => !currentMonthSet.has(id)
  ).length;
  
  const churnRate = lastMonthSet.size > 0 
    ? (lostCustomers / lastMonthSet.size) * 100 
    : 0;

  // AOV: Average Order Value
  let orderTotalsQuery = supabase
    .from('orders')
    .select('total_amount')
    .gte('created_at', thirtyDaysAgo.toISOString());
    
  const { data: orderTotals } = await buildOrderQuery(orderTotalsQuery);

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
    churnRate: Number(churnRate.toFixed(1)),
  };
}
