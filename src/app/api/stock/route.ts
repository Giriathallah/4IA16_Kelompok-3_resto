/**
 * @fileoverview API Routes untuk riwayat pergerakan stok produk
 * @module api/stock
 * @description Endpoint untuk melihat history perubahan stok (IN, OUT, ADJUSTMENT)
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, parsePagination } from "@/lib/http";

export const runtime = "nodejs";

/**
 * GET /api/stock
 *
 * Mengambil riwayat pergerakan stok dengan filter dan pagination.
 *
 * @param {NextRequest} req - Request object dari Next.js
 *
 * @queryParam {string} [productId] - Filter berdasarkan ID produk tertentu
 * @queryParam {string} [type] - Filter jenis pergerakan: IN | OUT | ADJUSTMENT
 * @queryParam {number} [page=1] - Nomor halaman untuk pagination
 * @queryParam {number} [perPage=10] - Jumlah item per halaman
 *
 * @returns {Promise<Response>} JSON response dengan format:
 *   - items: Array stock movement dengan id, productId, type, qty, note, createdAt, product.name
 *   - page: Halaman saat ini
 *   - perPage: Jumlah item per halaman
 *   - total: Total jumlah record
 *
 * @example
 * // Request: GET /api/stock?productId=uuid&type=IN&page=1&perPage=20
 * // Response: { items: [...], page: 1, perPage: 20, total: 50 }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") ?? undefined;
  const type = searchParams.get("type") ?? undefined; // IN | OUT | ADJUSTMENT
  const { skip, take, page, perPage } = parsePagination(searchParams);

  const where: any = {};
  if (productId) where.productId = productId;
  if (type && ["IN", "OUT", "ADJUSTMENT"].includes(type)) where.type = type;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        productId: true,
        type: true,
        qty: true,
        note: true,
        createdAt: true,
        product: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return json({ items, page, perPage, total });
}
