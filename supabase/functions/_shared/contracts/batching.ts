/**
 * BATCH OPTIMIZATION CONTRACTS (DENO-COMPATIBLE)
 * 
 * Re-exports shared validation schemas from src/contracts for edge functions.
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Request schema
export const BatchOptimizationRequestSchema = z.object({
  delivery_date: z.string().optional(),
  force_ai: z.boolean().default(false),
});

export type BatchOptimizationRequest = z.infer<typeof BatchOptimizationRequestSchema>;

// Batch metadata schema
export const BatchMetadataSchema = z.object({
  batch_id: z.number().int().positive(),
  order_count: z.number().int().positive(),
  collection_point_id: z.string(),
  collection_point_address: z.string(),
  zip_codes: z.array(z.string()),
  is_subsidized: z.boolean(),
  rationale: z.string().optional(),
});

export type BatchMetadata = z.infer<typeof BatchMetadataSchema>;

// Response schema
export const BatchOptimizationResponseSchema = z.object({
  success: z.boolean(),
  delivery_date: z.string(),
  batches_created: z.number().int(),
  total_orders: z.number().int(),
  optimization_method: z.enum(['ai', 'geographic_fallback']),
  optimization_confidence: z.number().min(0).max(1).optional(),
  fallback_reason: z.string().optional(),
  batches: z.array(BatchMetadataSchema),
});

export type BatchOptimizationResponse = z.infer<typeof BatchOptimizationResponseSchema>;
