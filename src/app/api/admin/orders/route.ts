import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type OrderStatus = "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
type DiningType = "DINE_IN" | "TAKE_AWAY";

function startOfDay(d = new Date()) {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
}
function endOfDay(d = new Date()) {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") ?? "").trim().toLowerCase(); // code / customer
    const status = (searchParams.get("status") ?? "all") as "all" | OrderStatus;
    const dining = (searchParams.get("dining") ?? "all") as "all" | DiningType;
    const range = (searchParams.get("range") ?? "7d") as
      | "today"
      | "7d"
      | "30d"
      | "all";

    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage") ?? "10"))
    );
    const skip = (page - 1) * perPage;
    const take = perPage;

    // where builder
    const AND: any[] = [];

    if (q) {
      AND.push({
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
        ],
      });
    }
    if (status !== "all") AND.push({ status });
    if (dining !== "all") AND.push({ diningType: dining });

    if (range !== "all") {
      if (range === "today") {
        AND.push({ createdAt: { gte: startOfDay(), lte: endOfDay() } });
      } else if (range === "7d") {
        AND.push({ createdAt: { gte: new Date(Date.now() - 7 * 864e5) } });
      } else if (range === "30d") {
        AND.push({ createdAt: { gte: new Date(Date.now() - 30 * 864e5) } });
      }
    }

    const where = AND.length ? { AND } : {};

    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          code: true,
          queueNumber: true,
          serviceDate: true,
          status: true,
          diningType: true,
          subtotal: true,
          discount: true,
          tax: true,
          total: true,
          createdAt: true,
          customer: { select: { name: true } },
          items: {
            select: {
              id: true,
              productId: true,
              qty: true,
              price: true,
              total: true,
              product: { select: { name: true } },
            },
          },
          payments: {
            select: {
              id: true,
              method: true,
              amount: true,
              refCode: true,
              paidAt: true,
            },
            orderBy: { paidAt: "desc" },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const items = rows.map((o) => ({
      id: o.id,
      code: o.code,
      queueNumber: o.queueNumber,
      serviceDate: o.serviceDate.toISOString(),
      status: o.status,
      diningType: o.diningType,
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      total: o.total,
      createdAt: o.createdAt.toISOString(),
      customerName: o.customer?.name ?? "-",
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.product.name,
        qty: it.qty,
        price: it.price,
        total: it.total,
      })),
      payments: o.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: p.amount,
        refCode: p.refCode ?? undefined,
        paidAt: p.paidAt.toISOString(),
      })),
    }));

    return NextResponse.json({ items, page, perPage, total });
  } catch (e) {
    console.error("[ADMIN_ORDERS_LIST]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
