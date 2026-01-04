import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/http";
import { setQtySchema } from "@/lib/validators/cart";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

/** PATCH /api/cart/item  { productId, qty }  → set quantity (0 = remove) */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const raw = await req.json().catch(() => ({}));
  const parse = setQtySchema.safeParse({
    ...raw,
    qty: typeof raw?.qty === "string" ? Number(raw.qty) : raw?.qty,
  });
  if (!parse.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid payload",
        issues: parse.error.flatten(),
      }),
      {
        status: 422,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const { productId, qty } = parse.data;

  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    select: { id: true },
  });
  if (!cart) return json({ ok: true }); // nothing to do

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
    select: { id: true },
  });
  if (!item) return json({ ok: true });

  if (qty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({ where: { id: item.id }, data: { qty } });
  }

  return json({ ok: true });
}

/** DELETE /api/cart/item?productId=... → hapus item tertentu */
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return new Response("productId required", { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    select: { id: true },
  });
  if (!cart) return json({ ok: true });

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return json({ ok: true });
}
