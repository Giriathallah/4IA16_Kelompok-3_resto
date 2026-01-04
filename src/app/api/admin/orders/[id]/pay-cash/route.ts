// src/app/api/admin/orders/[id]/pay-cash/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// pakai coerce agar "amount" string dari JSON tetap jadi number
const bodySchema = z.object({
  amount: z.coerce.number().int().nonnegative(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const json = await req.json().catch(() => ({}));
    const parse = bodySchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Payload tidak valid", issues: parse.error.flatten() },
        { status: 422 }
      );
    }
    const { amount } = parse.data;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "Order already paid" },
        { status: 409 }
      );
    }

    if (amount < order.total) {
      return NextResponse.json(
        { error: "Uang diterima kurang dari total." },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // catatan: kalau perlu, validasi stok tidak minus di sini
      for (const it of order.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.qty } },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: "CASH",
          amount: order.total,
          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID", closedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[ADMIN_PAY_CASH]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
