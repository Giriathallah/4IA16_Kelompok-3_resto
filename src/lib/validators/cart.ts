/**
 * @fileoverview Zod Validation Schemas untuk Keranjang Belanja
 * @module lib/validators/cart
 * @description Schema validasi untuk operasi keranjang: tambah item dan set quantity
 */

import { z } from "zod";

/**
 * Schema validasi untuk menambah item ke keranjang
 *
 * @property {string} productId - UUID produk yang akan ditambahkan
 * @property {number} qty - Jumlah item (1-999)
 */
export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().positive().max(999),
});

/**
 * Schema validasi untuk mengubah quantity item di keranjang
 *
 * @property {string} productId - UUID produk yang akan diubah
 * @property {number} qty - Quantity baru (0-999), dimana 0 berarti hapus item
 */
export const setQtySchema = z.object({
  productId: z.string().uuid(),
  qty: z.number().int().min(0).max(999),
});

