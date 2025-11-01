/**
 * REQUEST ID MIDDLEWARE
 * 
 * Generates unique request ID and injects into context for correlated logging.
 * Every edge function request gets a UUID that appears in all logs.
 */

export interface RequestIdContext {
  requestId: string;
}

/**
 * Middleware that generates a request ID and adds structured logging
 */
export function withRequestId<T extends RequestIdContext>(
  handler: (req: Request, ctx: T) => Promise<Response>
) {
  return async (req: Request, ctx: Partial<T>): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const url = new URL(req.url);
    const functionName = url.pathname.split('/').pop() || 'unknown';
    
    const requestIdContext = {
      ...ctx,
      requestId,
    } as T;
    
    console.log(`[${requestId}] [${functionName.toUpperCase()}] Request started: ${req.method} ${url.pathname}`);
    
    const startTime = Date.now();
    
    try {
      const response = await handler(req, requestIdContext);
      const duration = Date.now() - startTime;
      
      console.log(`[${requestId}] [${functionName.toUpperCase()}] Request completed: ${response.status} (${duration}ms)`);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] [${functionName.toUpperCase()}] Request failed after ${duration}ms:`, error);
      throw error;
    }
  };
}
