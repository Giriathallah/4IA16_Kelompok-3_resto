/**
 * @fileoverview API Routes untuk manajemen keranjang belanja (cart)
 * @module api/cart
 * @description Endpoint untuk operasi keranjang: lihat, tambah item, dan kosongkan cart
 */

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json } from "@/lib/http";
import { addToCartSchema } from "@/lib/validators/cart";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

/**
 * Helper function untuk memastikan cart user ada
 *
 * @param {string} userId - ID user yang sedang login
 * @returns {Promise<string>} ID cart (baru dibuat jika belum ada)
 * @private
 */

// Ambil/auto-buat cart untuk user
async function ensureCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { customerId: userId },
    create: { customerId: userId },
    update: {},
    select: { id: true },
  });
  return cart.id;
}

/**
 * GET /api/cart
 *
 * Mengambil daftar item dalam keranjang user yang sedang login.
 *
 * @param {NextRequest} _req - Request object (tidak digunakan)
 *
 * @returns {Promise<Response>} JSON response:
 *   - items: Array item dengan id, name, price, image, category, isActive, stock, quantity
 *   - updatedAt: Timestamp terakhir cart diupdate
 *
 * @throws {401} Unauthorized - Jika user belum login
 *
 * @example
 * // Response: { items: [{ id: "...", name: "Nasi Goreng", price: 25000, quantity: 2 }], updatedAt: "2024-01-17T..." }
 */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const cart = await prisma.cart.findUnique({
    where: { customerId: user.id },
    select: {
      id: true,
      items: {
        select: {
          id: true,
          qty: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              category: true,
              isActive: true,
              stock: true,
            },
          },
        },
      },
      updatedAt: true,
    },
  });

  const lines =
    cart?.items.map((it) => ({
      id: it.product.id,
      name: it.product.name,
      price: it.product.price,
      image: it.product.imageUrl ?? "",
      category: it.product.category,
      isActive: it.product.isActive,
      stock: it.product.stock,
      quantity: it.qty,
    })) ?? [];

  return json({ items: lines, updatedAt: cart?.updatedAt ?? null });
}

/**
 * POST /api/cart
 *
 * Menambahkan item ke keranjang user. Jika item sudah ada, quantity akan ditambahkan.
 *
 * @param {NextRequest} req - Request object dari Next.js
 *
 * @requestBody {Object} body - Data item yang ditambahkan
 * @requestBody {string} body.productId - ID produk yang akan ditambahkan (wajib)
 * @requestBody {number} body.qty - Jumlah item yang ditambahkan (wajib, minimal 1)
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses (200): { ok: true }
 *   - Error (401): Unauthorized - User belum login
 *   - Error (409): Product not available - Produk tidak aktif
 *   - Error (422): Invalid payload - Validasi gagal
 *
 * @example
 * // Request: { "productId": "uuid-produk", "qty": 2 }
 * // Response: { "ok": true }
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const raw = await req.json().catch(() => ({}));
  const parse = addToCartSchema.safeParse({
    ...raw,
    qty: typeof raw?.qty === "string" ? Number(raw.qty) : raw?.qty,
  });
  if (!parse.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid payload",
        issues: parse.error.flatten(),
      }),
      { status: 422, headers: { "content-type": "application/json" } }
    );
  }

  const { productId, qty } = parse.data;

  // Validasi produk aktif
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true, stock: true },
  });
  if (!product || !product.isActive)
    return new Response("Product not available", { status: 409 });

  const cartId = await ensureCart(user.id);

  // Upsert item
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId },
    select: { id: true, qty: true },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + qty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, qty },
    });
  }

  return json({ ok: true });
}

/**
 * DELETE /api/cart
 *
 * Mengosongkan seluruh keranjang user yang sedang login.
 * Menghapus cart beserta semua item di dalamnya.
 *
 * @param {NextRequest} _req - Request object (tidak digunakan)
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses (200): { ok: true }
 *   - Error (401): Unauthorized - User belum login
 *
 * @example
 * // Response: { "ok": true }
 */
export async function DELETE(_req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  await prisma.cart
    .delete({ where: { customerId: user.id } })
    .catch(() => null);
  return json({ ok: true });
}
