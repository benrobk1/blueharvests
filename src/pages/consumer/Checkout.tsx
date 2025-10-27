import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar, CreditCard, MapPin } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/formatMoney";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfDay } from "date-fns";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartTotal, cartCount } = useCart();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [useCredits, setUseCredits] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: credits } = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credits_ledger')
        .select('balance_after')
        .eq('consumer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.balance_after || 0;
    },
    enabled: !!user,
  });

  const { data: marketConfig } = useQuery({
    queryKey: ['market-config', profile?.zip_code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_configs')
        .select('*')
        .eq('zip_code', profile!.zip_code)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.zip_code,
  });

  // Generate available delivery dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfDay(new Date()), i + 1);
    const dayName = format(date, 'EEEE');
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return {
      value: dateStr,
      label: format(date, 'EEEE, MMM d'),
      isAvailable: marketConfig?.delivery_days?.includes(dayName) ?? true,
    };
  });

  const deliveryFee = marketConfig?.delivery_fee || 7.50;
  const platformFee = cartTotal * 0.10; // 10% platform fee
  const subtotal = cartTotal;
  const total = subtotal + deliveryFee;

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!user || !cart || !selectedDate) {
        throw new Error('Missing required data');
      }

      // Call checkout edge function
      const { data, error } = await supabase.functions.invoke('checkout', {
        body: {
          cart_id: cart.id,
          delivery_date: selectedDate,
          use_credits: useCredits,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        const errorMessages: { [key: string]: string } = {
          'INSUFFICIENT_INVENTORY': data.message || 'Some products are out of stock',
          'BELOW_MINIMUM_ORDER': data.message || `Minimum order is ${formatMoney(data.minimum)}`,
          'CUTOFF_PASSED': data.message || 'Order cutoff time has passed',
          'INVALID_DELIVERY_DATE': data.message || 'Invalid delivery date selected',
          'MISSING_PROFILE_INFO': data.message || 'Please complete your profile information',
          'NO_MARKET_CONFIG': data.message || 'Delivery not available in your area',
        };

        throw new Error(errorMessages[data.error] || data.message || 'Order failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Order placed!',
        description: `Your order has been confirmed for ${format(new Date(data.delivery_date), 'MMM d')}`,
      });
      navigate('/consumer/orders');
    },
    onError: (error: Error) => {
      toast({
        title: 'Order failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!cart || cartCount === 0) {
    return (
      <div className="min-h-screen bg-gradient-earth flex items-center justify-center p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/consumer/shop')}>Continue Shopping</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-earth p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/consumer/shop')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="text-muted-foreground">{profile?.delivery_address}</p>
                  <p className="text-muted-foreground">ZIP: {profile?.zip_code}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/consumer/profile')}>
                  Change Address
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Delivery Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedDate} onValueChange={setSelectedDate}>
                  <div className="space-y-3">
                    {availableDates.map((date) => (
                      <div key={date.value} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={date.value}
                          id={date.value}
                          disabled={!date.isAvailable}
                        />
                        <Label
                          htmlFor={date.value}
                          className={!date.isAvailable ? 'text-muted-foreground line-through' : ''}
                        >
                          {date.label}
                          {!date.isAvailable && ' (Not available)'}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Payment integration coming soon. Orders will be processed manually.
                </p>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{cartCount} items</p>
                  <div className="space-y-2">
                    {cart.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.products.name} x{item.quantity}
                        </span>
                        <span>{formatMoney(item.quantity * Number(item.unit_price))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{formatMoney(deliveryFee)}</span>
                  </div>
                  {credits && credits > 0 && (
                    <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                      <Checkbox
                        id="use-credits"
                        checked={useCredits}
                        onCheckedChange={(checked) => setUseCredits(checked as boolean)}
                      />
                      <Label htmlFor="use-credits" className="text-sm cursor-pointer flex-1">
                        Use {formatMoney(credits)} in available credits
                      </Label>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatMoney(useCredits && credits ? Math.max(0, total - credits) : total)}</span>
                  </div>
                  {useCredits && credits > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMoney(Math.min(credits, total))} credits will be applied
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => createOrder.mutate()}
                  disabled={!selectedDate || createOrder.isPending}
                >
                  {createOrder.isPending ? 'Processing...' : 'Place Order'}
                </Button>

                {!selectedDate && (
                  <p className="text-sm text-muted-foreground text-center">
                    Please select a delivery date
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
