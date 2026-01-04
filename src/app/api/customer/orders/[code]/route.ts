import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

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
