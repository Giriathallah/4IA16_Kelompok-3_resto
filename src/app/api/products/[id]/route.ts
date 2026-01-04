import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, error } from "@/lib/http";
import { productUpdateSchema } from "@/lib/validators/product";

export const runtime = "nodejs";

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const p = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      price: true,
      category: true,
      stock: true,
      isActive: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!p) return error("Not found", 404);
  return json(p);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const parse = productUpdateSchema.safeParse({
    ...body,
    price: typeof body?.price === "string" ? Number(body.price) : body?.price,
    stock: typeof body?.stock === "string" ? Number(body.stock) : body?.stock,
  });
  if (!parse.success)
    return error("Invalid payload", 422, { issues: parse.error.flatten() });

  const data = parse.data;
  try {
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name ?? undefined,
        price: data.price ?? undefined,
        category: data.category ?? undefined,
        stock: data.stock ?? undefined,
        isActive: data.isActive ?? undefined,
        imageUrl: data.imageUrl === "" ? null : data.imageUrl ?? undefined,
      },
      select: { id: true },
    });
    return json({ id: updated.id });
  } catch {
    return error("Not found", 404);
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch {
    return error("Not found", 404);
  }
}
