import { z } from "zod";

// Harus match enum Prisma
export const CategoryEnum = z.enum(["MAIN", "APPETIZER", "DRINK"]);
export const StockTypeEnum = z.enum(["IN", "OUT", "ADJUSTMENT"]);

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  category: CategoryEnum,
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export const productUpdateSchema = productCreateSchema.partial();

export const stockAdjustSchema = z.object({
  type: StockTypeEnum,
  qty: z.number().int().positive(),
  note: z.string().max(500).optional(),
});
