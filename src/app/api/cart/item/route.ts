import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json } from "@/lib/http";
import { setQtySchema } from "@/lib/validators/cart";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

/** PATCH /api/cart/item  { productId, qty }  → set quantity (0 = remove) */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userId = user.id;

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
      { status: 422, headers: { "content-type": "application/json" } }
    );
  }

  const { productId, qty } = parse.data;

  // Ambil cart (berdasar unique customerId)
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    select: { id: true },
  });
  if (!cart) return json({ ok: true });

  // Di schema kamu ada @@unique([cartId, productId])
  // Manfaatkan composite unique agar tidak perlu findFirst by scan.
  if (qty <= 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });
  } else {
    // Update langsung; kalau tidak ada, count=0 (kita abaikan → idempotent)
    await prisma.cartItem.updateMany({
      where: { cartId: cart.id, productId },
      data: { qty },
    });
  }

  return json({ ok: true });
}

/** DELETE /api/cart/item?productId=... → hapus item tertentu */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const userId = user.id;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return new Response("productId required", { status: 400 });

  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    select: { id: true },
  });
  if (!cart) return json({ ok: true });

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });

  return json({ ok: true });
}
