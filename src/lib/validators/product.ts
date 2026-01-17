/**
 * @fileoverview Zod Validation Schemas untuk Produk
 * @module lib/validators/product
 * @description Schema validasi untuk operasi CRUD produk dan penyesuaian stok
 */

import { z } from "zod";

/**
 * Enum kategori produk
 * Harus match dengan enum Category di Prisma schema
 * @constant
 */
export const CategoryEnum = z.enum(["MAIN", "APPETIZER", "DRINK"]);

/**
 * Enum tipe pergerakan stok
 * Harus match dengan enum StockType di Prisma schema
 * @constant
 */
export const StockTypeEnum = z.enum(["IN", "OUT", "ADJUSTMENT"]);

/**
 * Schema validasi untuk membuat produk baru
 *
 * @property {string} name - Nama produk (1-200 karakter)
 * @property {number} price - Harga produk dalam Rupiah (integer, non-negatif)
 * @property {string} category - Kategori: MAIN | APPETIZER | DRINK
 * @property {number} [stock=0] - Stok awal (integer, non-negatif)
 * @property {boolean} [isActive=true] - Status aktif produk
 * @property {string} [imageUrl] - URL gambar produk (opsional)
 */
export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  category: CategoryEnum,
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

/**
 * Schema validasi untuk update produk (semua field optional)
 * Extends dari productCreateSchema dengan .partial()
 */
export const productUpdateSchema = productCreateSchema.partial();

/**
 * Schema validasi untuk penyesuaian stok
 *
 * @property {string} type - Tipe penyesuaian: IN | OUT | ADJUSTMENT
 * @property {number} qty - Jumlah perubahan stok (integer positif)
 * @property {string} [note] - Catatan penyesuaian (maks 500 karakter)
 */
export const stockAdjustSchema = z.object({
  type: StockTypeEnum,
  qty: z.number().int().positive(),
  note: z.string().max(500).optional(),
});

