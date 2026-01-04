// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

type OrderStatus = "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function getRange(range: "today" | "7d" | "30d" | "all") {
  const now = new Date();
  if (range === "today") return { from: startOfDay(now), to: endOfDay(now) };
  if (range === "7d")
    return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) };
  if (range === "30d")
    return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) };
  return { from: undefined, to: undefined };
}

function mapPaymentLabel(m?: "CASH" | "QRIS" | "CARD" | "BANK_TRANSFER") {
  if (!m) return undefined;
  if (m === "CASH") return "CASH";
  if (m === "QRIS") return "QRIS";
  return "MIDTRANS";
}

export async function GET(req: NextRequest) {
  try {
    // Auth admin
    const me = await getCurrentUser({ withFullUser: false });
    if (!me?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const meDb = await prisma.user.findUnique({
      where: { id: me.id },
      select: { role: true },
    });
    if (meDb?.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Query params
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const perPage = Math.min(
      50,
      Math.max(1, Number(url.searchParams.get("perPage") ?? "12"))
    );
    const sort = (url.searchParams.get("sort") ?? "newest") as
      | "newest"
      | "oldest";
    const range = (url.searchParams.get("range") ?? "7d") as
      | "today"
      | "7d"
      | "30d"
      | "all";

    // Selalu paksa status PAID
    const { from, to } = getRange(range);
    const whereBase: any = { status: "PAID" as OrderStatus };
    if (from && to) whereBase.createdAt = { gte: from, lte: to };

    // KPI untuk PAID (dipakai jika nanti mau ditampilkan)
    const [ordersInRange, uniqueCustomers] = await Promise.all([
      prisma.order.findMany({
        where: whereBase,
        select: { id: true, total: true, customerId: true },
      }),
      prisma.order.groupBy({
        by: ["customerId"],
        where: whereBase,
        _count: { customerId: true },
      }),
    ]);
    const revenue = ordersInRange.reduce((s, o) => s + (o.total ?? 0), 0);
    const ordersCount = ordersInRange.length;
    const aov = ordersCount ? Math.round(revenue / ordersCount) : 0;
    const customersCount = uniqueCustomers.length;

    // Series hanya PAID
    async function buildDailySeries(days: number) {
      const fromX = startOfDay(addDays(new Date(), -(days - 1)));
      const toX = endOfDay(new Date());
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: fromX, lte: toX }, status: "PAID" },
        select: { createdAt: true, total: true },
      });
      const bucket: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const d = startOfDay(addDays(fromX, i));
        const key = d.toISOString().slice(0, 10);
        bucket[key] = 0;
      }
      for (const o of orders) {
        const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
        if (bucket[key] != null) bucket[key] += o.total ?? 0;
      }
      return Object.keys(bucket)
        .sort()
        .map((k) => ({ date: k, value: bucket[k] }));
    }
    const [series7d, series30d] = await Promise.all([
      buildDailySeries(7),
      buildDailySeries(30),
    ]);

    // Daftar orders PAID
    const totalRows = await prisma.order.count({ where: whereBase });
    const orderRows = await prisma.order.findMany({
      where: whereBase,
      orderBy: { createdAt: sort === "newest" ? "desc" : "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        code: true,
        createdAt: true,
        status: true,
        total: true,
        customer: { select: { name: true, email: true } },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 1,
          select: { method: true },
        },
      },
    });

    const rows = orderRows.map((o) => ({
      code: o.code,
      createdAt: o.createdAt,
      customer:
        o.customer?.name ||
        (o.customer?.email ? o.customer.email.split("@")[0] : "Guest"),
      status: o.status, // selalu "PAID"
      total: o.total,
      method: mapPaymentLabel(o.payments[0]?.method),
    }));

    const resp = NextResponse.json({
      // kpi disertakan, meski halaman sekarang hanya pakai chart & tabel
      kpi: { revenue, orders: ordersCount, aov, customers: customersCount },
      series: { days7: series7d, days30: series30d },
      orders: { rows, total: totalRows, page, perPage },
    });
    resp.headers.set("Cache-Control", "no-store");
    return resp;
  } catch (e) {
    console.error("[ADMIN_DASHBOARD_GET]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
