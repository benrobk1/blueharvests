import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney } from '@/lib/formatMoney';
import { DollarSign, TrendingUp, Users, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Analytics = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      // Get all users with their first order date
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, acquisition_channel, created_at');

      // Get all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('consumer_id, total_amount, created_at, status')
        .eq('status', 'delivered');

      // Get subscriptions data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('consumer_id, status, created_at, monthly_spend, current_period_start, current_period_end');

      // Calculate LTV per customer
      const customerLTV = new Map<string, number>();
      orders?.forEach(order => {
        const current = customerLTV.get(order.consumer_id) || 0;
        customerLTV.set(order.consumer_id, current + Number(order.total_amount));
      });

      const avgLTV = customerLTV.size > 0 
        ? Array.from(customerLTV.values()).reduce((sum, val) => sum + val, 0) / customerLTV.size 
        : 0;

      // Calculate CAC by channel
      const channelStats = new Map<string, { users: number; totalSpend: number }>();
      profiles?.forEach(profile => {
        const channel = profile.acquisition_channel || 'organic';
        const userLTV = customerLTV.get(profile.id) || 0;
        const current = channelStats.get(channel) || { users: 0, totalSpend: 0 };
        channelStats.set(channel, {
          users: current.users + 1,
          totalSpend: current.totalSpend + userLTV,
        });
      });

      const cacByChannel = Array.from(channelStats.entries()).map(([channel, stats]) => ({
        channel,
        users: stats.users,
        avgValue: stats.users > 0 ? stats.totalSpend / stats.users : 0,
        // Assume CAC is 20% of LTV for estimation
        cac: stats.users > 0 ? (stats.totalSpend / stats.users) * 0.2 : 0,
      }));

      // Calculate subscription metrics
      const activeSubscriptions = subscriptions?.filter(s => s.status === 'active').length || 0;
      const totalSubscribers = subscriptions?.length || 0;
      const retentionRate = totalSubscribers > 0 ? (activeSubscriptions / totalSubscribers) * 100 : 0;
      const churnRate = 100 - retentionRate;

      // Calculate MRR
      const currentMonth = new Date().toISOString().slice(0, 7);
      const mrr = subscriptions
        ?.filter(s => s.status === 'active')
        .reduce((sum, s) => sum + Number(s.monthly_spend), 0) || 0;

      // Calculate profitability per household (monthly active customers)
      const monthlyActiveCustomers = new Set(
        orders
          ?.filter(o => o.created_at.startsWith(currentMonth))
          .map(o => o.consumer_id)
      ).size;

      const monthlyRevenue = orders
        ?.filter(o => o.created_at.startsWith(currentMonth))
        .reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      // Get monthly costs (payouts)
      const { data: monthlyPayouts } = await supabase
        .from('payouts')
        .select('amount')
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-31`);

      const monthlyCosts = monthlyPayouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const monthlyProfit = monthlyRevenue - monthlyCosts;
      const profitPerHousehold = monthlyActiveCustomers > 0 ? monthlyProfit / monthlyActiveCustomers : 0;

      // Monthly trends
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return date.toISOString().slice(0, 7);
      });

      const monthlyTrends = last6Months.map(month => {
        const monthOrders = orders?.filter(o => o.created_at.startsWith(month)) || [];
        const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const customers = new Set(monthOrders.map(o => o.consumer_id)).size;
        
        return {
          month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
          revenue,
          customers,
        };
      });

      return {
        avgLTV,
        cacByChannel,
        retentionRate,
        churnRate,
        mrr,
        monthlyActiveCustomers,
        profitPerHousehold,
        monthlyTrends,
        totalCustomers: customerLTV.size,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Customer acquisition, retention, and profitability metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(analyticsData?.avgLTV || 0)}</div>
            <p className="text-xs text-muted-foreground">{analyticsData?.totalCustomers || 0} customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(analyticsData?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">{analyticsData?.monthlyActiveCustomers || 0} active customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.retentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Churn: {analyticsData?.churnRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit/Household</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(analyticsData?.profitPerHousehold || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Growth Trends</TabsTrigger>
          <TabsTrigger value="cac">CAC by Channel</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Trends</CardTitle>
              <CardDescription>Revenue and customer growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={analyticsData?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="customers" stroke="hsl(var(--earth))" strokeWidth={2} name="Customers" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cac">
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition by Channel</CardTitle>
              <CardDescription>CAC and customer value by acquisition source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analyticsData?.cacByChannel || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Bar dataKey="cac" fill="hsl(var(--destructive))" name="Est. CAC" />
                  <Bar dataKey="avgValue" fill="hsl(var(--primary))" name="Avg Customer Value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;