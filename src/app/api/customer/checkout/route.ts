/**
 * @fileoverview API Route untuk proses checkout order
 * @module api/customer/checkout
 * @description Endpoint untuk memproses checkout dari keranjang menjadi order,
 *              mendukung pembayaran CASH dan CASHLESS (Midtrans)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { z } from "zod";
import midtransClient from "midtrans-client";

export const runtime = "nodejs";

/**
 * Schema validasi untuk body request checkout
 * @constant
 */
const bodySchema = z.object({
  diningType: z.enum(["DINE_IN", "TAKE_AWAY"]),
  paymentChoice: z.enum(["CASH", "CASHLESS"]),
});

/**
 * Menghitung awal hari (00:00:00.000)
 * @param {Date} [d=new Date()] - Tanggal yang akan dihitung
 * @returns {Date} Tanggal dengan waktu 00:00:00.000
 * @private
 */
function startOfDay(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}

/**
 * Menghitung akhir hari (23:59:59.999)
 * @param {Date} [d=new Date()] - Tanggal yang akan dihitung
 * @returns {Date} Tanggal dengan waktu 23:59:59.999
 * @private
 */
function endOfDay(d = new Date()) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

/**
 * Mengambil nomor antrian untuk hari ini
 * Nomor antrian dihitung berdasarkan jumlah order pada hari yang sama
 * @returns {Promise<string>} Nomor antrian dengan format 3 digit (e.g., "001", "042")
 * @private
 */
async function getTodayQueueNumber() {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const count = await prisma.order.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
  return String(count + 1).padStart(3, "0");
}

/**
 * Membuat kode order unik berdasarkan tanggal dan nomor antrian
 * @param {string} queueNumber - Nomor antrian (3 digit)
 * @returns {string} Kode order dengan format: ORD-YYYYMMDD-XXX
 * @example
 * // Returns: "ORD-20240117-001"
 * makeOrderCode("001")
 * @private
 */
function makeOrderCode(queueNumber: string) {
  const yyyy = new Date().getFullYear().toString();
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  const dd = String(new Date().getDate()).padStart(2, "0");
  return `ORD-${yyyy}${mm}${dd}-${queueNumber}`;
}

/**
 * POST /api/customer/checkout
 *
 * Memproses checkout dari keranjang menjadi order baru.
 * Mendukung dua metode pembayaran: CASH dan CASHLESS (Midtrans).
 *
 * @param {NextRequest} req - Request object dari Next.js
 *
 * @requestBody {Object} body - Data checkout
 * @requestBody {string} body.diningType - Jenis pesanan: "DINE_IN" | "TAKE_AWAY"
 * @requestBody {string} body.paymentChoice - Metode pembayaran: "CASH" | "CASHLESS"
 *
 * @returns {Promise<Response>} JSON response:
 *   - Sukses CASH: { ok: true, orderId, code, total, payment: { method: "CASH" } }
 *   - Sukses CASHLESS: { ok: true, orderId, code, mid, total, payment: { method: "CASHLESS", snapToken } }
 *   - Error (401): Unauthorized - User belum login
 *   - Error (409): Keranjang kosong / Produk tidak tersedia / Stok tidak cukup
 *   - Error (422): Payload tidak valid
 *   - Error (500): Server error / Midtrans tidak dikonfigurasi
 *
 * @description
 * Proses checkout meliputi:
 * 1. Validasi user login
 * 2. Validasi payload request
 * 3. Ambil dan validasi item keranjang (stok dan status aktif)
 * 4. Hitung subtotal, discount, tax, dan total
 * 5. Buat order dan order items dalam transaction
 * 6. Hapus keranjang setelah checkout berhasil
 * 7. Jika CASHLESS, generate Midtrans Snap token
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser({ withFullUser: false });
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => ({}));
    const parse = bodySchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Payload tidak valid", issues: parse.error.flatten() },
        { status: 422 }
      );
    }
    const { diningType, paymentChoice } = parse.data;

    // Ambil cart user
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
                stock: true,
                isActive: true,
                imageUrl: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong." }, { status: 409 });
    }

    // Validasi stok & active
    for (const it of cart.items) {
      if (!it.product.isActive) {
        return NextResponse.json(
          { error: `Produk ${it.product.name} tidak tersedia.` },
          { status: 409 }
        );
      }
      if (it.qty > it.product.stock) {
        return NextResponse.json(
          { error: `Stok ${it.product.name} tidak mencukupi.` },
          { status: 409 }
        );
      }
    }

    const subtotal = cart.items.reduce(
      (s, it) => s + it.product.price * it.qty,
      0
    );
    const discount = 0;
    const tax = 0; // kalau mau PPN 11%: Math.round(0.11 * subtotal)
    const total = subtotal - discount + tax;

    // Buat order & item dalam transaksi
    const created = await prisma.$transaction(async (tx) => {
      const queueNumber = await getTodayQueueNumber();
      const code = makeOrderCode(queueNumber);

      const order = await tx.order.create({
        data: {
          code,
          queueNumber,
          diningType,
          status: "AWAITING_PAYMENT",
          subtotal,
          discount,
          tax,
          total,
          customerId: user.id,
          items: {
            create: cart.items.map((it) => ({
              productId: it.product.id,
              qty: it.qty,
              price: it.product.price,
              total: it.product.price * it.qty,
            })),
          },
        },
        select: { id: true, code: true, total: true },
      });

      await tx.cart.delete({ where: { customerId: user.id } });

      return order;
    });

    if (paymentChoice === "CASH") {
      return NextResponse.json({
        ok: true,
        orderId: created.id,
        code: created.code,
        total: created.total,
        payment: { method: "CASH" },
      });
    }

    // CASHLESS → buat Midtrans Snap token
    const isProduction =
      process.env.MIDTRANS_IS_PRODUCTION === "true" ? true : false;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY tidak dikonfigurasi." },
        { status: 500 }
      );
    }

    const snap = new midtransClient.Snap({
      isProduction,
      serverKey,
    });

    const midtransOrderId = `${created.code}-${created.id.slice(0, 8)}`;

    const snapParams = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: created.total,
      },
      credit_card: {
        secure: true,
      },
      custom_field1: created.id,
      custom_field2: created.code,
    };

    const snapToken = await snap.createTransactionToken(snapParams);

    return NextResponse.json({
      ok: true,
      orderId: created.id,
      code: created.code,
      mid: midtransOrderId,
      total: created.total,
      payment: { method: "CASHLESS", snapToken },
    });
  } catch (err) {
    console.error("[CHECKOUT_POST]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
