import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive().max(999),
});

export const setQtySchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(0).max(999), // 0 = remove
});
