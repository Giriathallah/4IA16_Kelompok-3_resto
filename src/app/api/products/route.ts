/**
 * @fileoverview API Routes untuk manajemen produk restoran
 * @module api/products
 * @description Endpoint untuk operasi CRUD produk dengan fitur filtering,
 *              sorting, dan pagination
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, error, parsePagination } from "@/lib/http";
import { productCreateSchema, CategoryEnum } from "@/lib/validators/product";
import type { Prisma } from "@/generated/prisma";
import { Category } from "@/generated/prisma";

export const runtime = "nodejs";

/**
 * GET /api/products
 *
 * Mengambil daftar produk dengan berbagai filter dan opsi sorting.
 *
 * @param {NextRequest} req - Request object dari Next.js
 *
 * @queryParam {string} [q] - Kata kunci pencarian nama produk (case-insensitive)
 * @queryParam {string} [category] - Filter kategori: MAIN | APPETIZER | DRINK
 * @queryParam {string} [active] - Filter status aktif: "true" | "false"
 * @queryParam {string} [sort] - Opsi sorting: name_asc | name_desc | price_asc | price_desc | createdAt_desc
 * @queryParam {number} [page=1] - Nomor halaman untuk pagination
 * @queryParam {number} [perPage=10] - Jumlah item per halaman
 *
 * @returns {Promise<Response>} JSON response dengan format:
 *   - items: Array produk dengan id, name, price, category, stock, isActive, imageUrl, timestamps
 *   - page: Halaman saat ini
 *   - perPage: Jumlah item per halaman
 *   - total: Total jumlah produk yang match dengan filter
 *
 * @example
 * // Request: GET /api/products?q=nasi&category=MAIN&active=true&sort=price_asc&page=1&perPage=10
 * // Response: { items: [...], page: 1, perPage: 10, total: 25 }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category");
  const active = searchParams.get("active");
  const sortParam = (
    searchParams.get("sort") ?? "createdAt_desc"
  ).toLowerCase();
  const { skip, take, page, perPage } = parsePagination(searchParams);

  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  if (
    category &&
    (CategoryEnum.options as readonly string[]).includes(category)
  ) {
    where.category = category as Category;
  }

  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortParam === "name_asc"
      ? { name: "asc" }
      : sortParam === "name_desc"
        ? { name: "desc" }
        : sortParam === "price_asc"
          ? { price: "asc" }
          : sortParam === "price_desc"
            ? { price: "desc" }
            : { createdAt: "desc" }; // default

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        stock: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return json({ items, page, perPage, total });
}

/**
 * POST /api/products
 *
 * Membuat produk baru di database.
 *
 * @param {NextRequest} req - Request object dari Next.js
 *
 * @requestBody {Object} body - Data produk baru
 * @requestBody {string} body.name - Nama produk (wajib)
 * @requestBody {number} body.price - Harga produk dalam Rupiah (wajib)
 * @requestBody {string} body.category - Kategori: MAIN | APPETIZER | DRINK (wajib)
 * @requestBody {number} [body.stock=0] - Stok awal produk
 * @requestBody {boolean} [body.isActive=true] - Status aktif produk
 * @requestBody {string} [body.imageUrl] - URL gambar produk (opsional)
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses (201): { id: string } - ID produk yang baru dibuat
 *   - Error (422): { error: string, issues: object } - Validasi gagal
 *
 * @example
 * // Request body:
 * // { "name": "Nasi Goreng", "price": 25000, "category": "MAIN", "stock": 50 }
 * // Response: { "id": "uuid-produk-baru" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = productCreateSchema.safeParse({
    ...body,
    price: typeof body?.price === "string" ? Number(body.price) : body?.price,
    stock: typeof body?.stock === "string" ? Number(body.stock) : body?.stock,
  });
  if (!parsed.success) {
    return error("Invalid payload", 422, { issues: parsed.error.flatten() });
  }

  const data = parsed.data;
  const created = await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      category: data.category, // Prisma enum → Postgres enum
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
      imageUrl: data.imageUrl || null,
    },
    select: { id: true },
  });

  return json({ id: created.id }, 201);
}
