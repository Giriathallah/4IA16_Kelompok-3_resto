import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, error } from "@/lib/http";
import { stockAdjustSchema } from "@/lib/validators/product";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parse = stockAdjustSchema.safeParse({
    ...body,
    qty: typeof body?.qty === "string" ? Number(body.qty) : body?.qty,
  });
  if (!parse.success)
    return error("Invalid payload", 422, { issues: parse.error.flatten() });

  const { type, qty, note } = parse.data;

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: params.id },
      select: { id: true, stock: true },
    });
    if (!product) return error("Product not found", 404);

    let newStock = product.stock;
    if (type === "IN") newStock += qty;
    else if (type === "OUT") newStock -= qty;
    else if (type === "ADJUSTMENT") newStock = qty;

    if (newStock < 0)
      return error("Stock cannot be negative", 409, {
        currentStock: product.stock,
        attempted: newStock,
      });

    await tx.product.update({
      where: { id: params.id },
      data: { stock: newStock },
    });
    const mv = await tx.stockMovement.create({
      data: { productId: params.id, type, qty, note: note ?? null },
      select: { id: true, createdAt: true },
    });

    return json({ movementId: mv.id, newStock });
  });
}
