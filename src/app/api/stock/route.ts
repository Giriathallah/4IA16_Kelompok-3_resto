import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, parsePagination } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") ?? undefined;
  const type = searchParams.get("type") ?? undefined; // IN | OUT | ADJUSTMENT
  const { skip, take, page, perPage } = parsePagination(searchParams);

  const where: any = {};
  if (productId) where.productId = productId;
  if (type && ["IN", "OUT", "ADJUSTMENT"].includes(type)) where.type = type;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        productId: true,
        type: true,
        qty: true,
        note: true,
        createdAt: true,
        product: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return json({ items, page, perPage, total });
}
