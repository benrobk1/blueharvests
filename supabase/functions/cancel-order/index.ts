/**
 * CANCEL ORDER EDGE FUNCTION
 * Cancels orders with inventory restoration and cleanup
 * 
 * Full Middleware Pattern:
 * RequestId + CORS + Auth + RateLimit + Validation + ErrorHandling
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { loadConfig } from '../_shared/config.ts';
import { RATE_LIMITS } from '../_shared/constants.ts';
import { CancelOrderRequestSchema } from '../_shared/contracts/index.ts';
import { OrderCancellationService } from '../_shared/services/OrderCancellationService.ts';
import { 
  withRequestId, 
  withCORS, 
  withAuth,
  withValidation,
  withRateLimit,
  withErrorHandling, 
  createMiddlewareStack,
  type RequestIdContext,
  type CORSContext,
  type AuthContext,
  type ValidationContext
} from '../_shared/middleware/index.ts';

type CancelOrderInput = { orderId: string };
type Context = RequestIdContext & CORSContext & AuthContext & ValidationContext<CancelOrderInput>;

/**
 * Main handler with middleware composition
 */
const handler = async (req: Request, ctx: Context): Promise<Response> => {
  const config = loadConfig();
  const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  const user = ctx.user;
  const { orderId } = ctx.input;

  // Business logic
  console.log(`[${ctx.requestId}] Cancelling order ${orderId} for user ${user.id}`);
  const cancellationService = new OrderCancellationService(supabase);

  try {
    await cancellationService.cancelOrder(orderId, user.id);
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';

    if (errorMessage.includes('ORDER_NOT_FOUND')) {
      return new Response(
        JSON.stringify({
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        }),
        { status: 404, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (errorMessage.includes('INVALID_STATUS')) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_STATUS',
          message: errorMessage.split(': ')[1] || 'Cannot cancel order with current status',
        }),
        { status: 400, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (errorMessage.includes('TOO_LATE_TO_CANCEL')) {
      return new Response(
        JSON.stringify({
          error: 'TOO_LATE_TO_CANCEL',
          message: 'Cannot cancel orders within 24 hours of delivery',
        }),
        { status: 400, headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw error;
  }

  console.log(`[${ctx.requestId}] ✅ Order ${orderId} cancelled successfully`);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Order cancelled and deleted successfully',
    }),
    {
      status: 200,
      headers: { ...ctx.corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};

// Compose middleware stack
const middlewareStack = createMiddlewareStack<Context>([
  withRequestId,
  withCORS,
  withAuth,
  withRateLimit(RATE_LIMITS.CANCEL_ORDER),
  withValidation(CancelOrderRequestSchema),
  withErrorHandling
]);

serve((req) => middlewareStack(handler)(req, {} as any));
