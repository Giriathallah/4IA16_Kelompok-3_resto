/**
 * @fileoverview API Route untuk detail order berdasarkan kode
 * @module api/customer/orders/[code]
 * @description Endpoint untuk melihat detail order dan menandai order sebagai PAID (CASH)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * GET /api/customer/orders/[code]
 *
 * Mengambil detail order berdasarkan kode order.
 * Hanya menampilkan order milik user yang sedang login.
 *
 * @param {NextRequest} _req - Request object (tidak digunakan)
 * @param {Object} ctx - Context object dengan params
 * @param {Promise<{code: string}>} ctx.params - Parameter route dengan kode order
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses: { code, status, total, items: [{ productName, qty, price, total }] }
 *   - Error (401): Unauthorized - User belum login
 *   - Error (404): Order tidak ditemukan
 *   - Error (500): Server error
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;

    const user = await getCurrentUser({ withFullUser: false });
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: { code, customerId: user.id },
      select: {
        code: true,
        status: true,
        total: true,
        items: {
          select: {
            qty: true,
            price: true,
            total: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      code: order.code,
      status: order.status,
      total: order.total,
      items: order.items.map((it) => ({
        productName: it.product.name,
        qty: it.qty,
        price: it.price,
        total: it.total,
      })),
    });
  } catch (e) {
    console.error("[ORDER_DETAIL_GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/customer/orders/[code]
 *
 * Menandai order sebagai PAID (untuk pembayaran CASH).
 * Mengurangi stok produk dan mengupdate status order dalam satu transaksi.
 *
 * @param {NextRequest} _req - Request object (tidak digunakan)
 * @param {Object} ctx - Context object dengan params
 * @param {Promise<{code: string}>} ctx.params - Parameter route dengan kode order
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses: { ok: true }
 *   - Already paid: { ok: true, already: true }
 *   - Error (404): Order tidak ditemukan
 *   - Error (500): Server error
 *
 * @description
 * Proses pembayaran meliputi:
 * 1. Cari order berdasarkan kode
 * 2. Cek apakah sudah PAID (return early jika sudah)
 * 3. Dalam transaction: kurangi stok produk, update status ke PAID
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;

    const order = await prisma.order.findUnique({
      where: { code },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ ok: true, already: true });
    }

    await prisma.$transaction(async (tx) => {
      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.qty } },
        });
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", closedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ORDER_MARK_PAID]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
