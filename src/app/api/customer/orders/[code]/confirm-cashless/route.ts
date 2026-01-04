import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

function mapMidtransToPaymentMethod(
  paymentType?: string
): "QRIS" | "CARD" | "BANK_TRANSFER" {
  switch ((paymentType ?? "").toLowerCase()) {
    case "qris":
      return "QRIS";
    case "credit_card":
      return "CARD";
    case "echannel":
    case "permata":
    case "bank_transfer":
    case "bca_va":
    case "bni_va":
    case "bri_va":
      return "BANK_TRANSFER";
    default:
      // e-wallet (gopay/shopee/dll) → fallback CARD (atau tambah enum baru bila perlu)
      return "CARD";
  }
}

function isPaid(status: any): boolean {
  const ts = (status?.transaction_status ?? "").toLowerCase();
  const fraud = (status?.fraud_status ?? "").toLowerCase();
  if (ts === "settlement") return true;
  if (ts === "capture" && (fraud === "accept" || !fraud)) return true;
  return false;
}

function parseAmount(gross_amount: string | number): number {
  if (typeof gross_amount === "number") return Math.round(gross_amount);
  const n = Math.round(parseFloat(String(gross_amount ?? "0")));
  return Number.isFinite(n) ? n : 0;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params;

    const user = await getCurrentUser({ withFullUser: false });
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil 'mid' dari query (order_id yang dipakai Midtrans)
    const url = new URL(req.url);
    const mid = url.searchParams.get("mid") || undefined;

    const order = await prisma.order.findFirst({
      where: { code, customerId: user.id },
      include: { items: true, payments: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "MIDTRANS_SERVER_KEY not configured" },
        { status: 500 }
      );
    }
    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProd
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";

    // Gunakan 'mid' kalau tersedia, kalau tidak pakai 'code'
    const orderIdForMidtrans = mid || code;

    const res = await fetch(
      `${baseUrl}/${encodeURIComponent(orderIdForMidtrans)}/status`,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from(serverKey + ":").toString("base64"),
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );
    const status = await res.json();
    if (!res.ok) {
      return NextResponse.json(status, { status: res.status });
    }

    if (!isPaid(status)) {
      return NextResponse.json({ ok: false, paid: false, midtrans: status });
    }

    const method = mapMidtransToPaymentMethod(status?.payment_type);
    const amountFromMidtrans = parseAmount(status?.gross_amount);
    const refCode = status?.transaction_id as string | undefined;

    const alreadyPaid = order.status === "PAID";
    const alreadyRecorded = refCode
      ? !!(await prisma.payment
          .findUnique({ where: { refCode } })
          .catch(() => null))
      : false;

    if (alreadyPaid && alreadyRecorded) {
      return NextResponse.json({ ok: true, paid: true, already: true });
    }

    await prisma.$transaction(async (tx) => {
      if (!alreadyPaid) {
        for (const it of order.items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { decrement: it.qty } },
          });
        }
      }

      if (!alreadyRecorded) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            method,
            amount: amountFromMidtrans || order.total,
            refCode, // unique
            paidAt: new Date(),
          },
        });
      }

      if (!alreadyPaid) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", closedAt: new Date() },
        });
      }
    });

    return NextResponse.json({ ok: true, paid: true });
  } catch (e) {
    console.error("[CONFIRM_CASHLESS_ERROR]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
