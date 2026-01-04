import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser({
      withFullUser: false,
      redirectIfNotFound: false,
    });
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orders = await prisma.order.findMany({
      where: { customerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        code: true,
        createdAt: true,
        total: true,
        status: true,
        items: {
          select: {
            qty: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    const data = orders.map((o) => ({
      id: o.code ?? o.id,
      date: o.createdAt.toISOString(),
      total: o.total,
      status: o.status, // OPEN | AWAITING_PAYMENT | PAID | CANCELLED
      items: o.items.map((it) =>
        it.qty > 1 ? `${it.product.name} x${it.qty}` : it.product.name
      ),
    }));

    return NextResponse.json({ items: data });
  } catch (e) {
    console.error("[ORDERS_HISTORY_GET]", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
