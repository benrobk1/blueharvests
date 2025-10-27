import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatMoney } from '@/lib/formatMoney';
import { DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

const FinancialReports = () => {
  const { data: financialData, isLoading } = useQuery({
    queryKey: ['financial-reports'],
    queryFn: async () => {
      // Get all completed orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status')
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      // Get all payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('amount, status, recipient_type, created_at');

      if (payoutsError) throw payoutsError;

      // Get all transaction fees
      const { data: fees, error: feesError } = await supabase
        .from('transaction_fees')
        .select('amount, fee_type');

      if (feesError) throw feesError;

      // Calculate metrics
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
      const totalPayouts = payouts?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const platformFees = fees?.filter(f => f.fee_type === 'platform').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const deliveryFees = fees?.filter(f => f.fee_type === 'delivery').reduce((sum, f) => sum + Number(f.amount), 0) || 0;

      // Revenue by month
      const revenueByMonth = orders?.reduce((acc: any, order) => {
        const month = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short' });
        acc[month] = (acc[month] || 0) + Number(order.total_amount);
        return acc;
      }, {});

      const monthlyData = Object.entries(revenueByMonth || {}).map(([month, revenue]) => ({
        month,
        revenue: Number(revenue),
      }));

      // Payout breakdown
      const farmerPayouts = payouts?.filter(p => p.recipient_type === 'farmer').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const driverPayouts = payouts?.filter(p => p.recipient_type === 'driver').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const payoutBreakdown = [
        { name: 'Farmers', value: farmerPayouts },
        { name: 'Drivers', value: driverPayouts },
      ];

      return {
        totalRevenue,
        totalPayouts,
        platformFees,
        deliveryFees,
        netProfit: totalRevenue - totalPayouts,
        monthlyData,
        payoutBreakdown,
        ordersCount: orders?.length || 0,
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
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Platform revenue, payouts, and commission analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financialData?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{financialData?.ordersCount || 0} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financialData?.totalPayouts || 0)}</div>
            <p className="text-xs text-muted-foreground">To farmers & drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(financialData?.platformFees || 0)}</div>
            <p className="text-xs text-muted-foreground">10% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(financialData?.netProfit || 0)}
            </div>
            <p className="text-xs text-muted-foreground">After payouts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="payouts">Payout Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={financialData?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout Distribution</CardTitle>
              <CardDescription>Breakdown by recipient type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={financialData?.payoutBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatMoney(value)}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financialData?.payoutBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
