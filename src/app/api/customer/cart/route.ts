import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json } from "@/lib/http";
import { addToCartSchema } from "@/lib/validators/cart";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const runtime = "nodejs";

// Ambil/auto-buat cart untuk user
async function ensureCart(userId: string) {
  const cart = await prisma.cart.upsert({
    where: { customerId: userId },
    create: { customerId: userId },
    update: {},
    select: { id: true },
  });
  return cart.id;
}

/** GET /api/cart  → daftar item cart user */
export async function GET(_req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const cart = await prisma.cart.findUnique({
    where: { customerId: user.id },
    select: {
      id: true,
      items: {
        select: {
          id: true,
          qty: true,
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              imageUrl: true,
              category: true,
              isActive: true,
              stock: true,
            },
          },
        },
      },
      updatedAt: true,
    },
  });

  const lines =
    cart?.items.map((it) => ({
      id: it.product.id,
      name: it.product.name,
      price: it.product.price,
      image: it.product.imageUrl ?? "",
      category: it.product.category,
      isActive: it.product.isActive,
      stock: it.product.stock,
      quantity: it.qty,
    })) ?? [];

  return json({ items: lines, updatedAt: cart?.updatedAt ?? null });
}

/** POST /api/cart  → tambah item (productId, qty) */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const raw = await req.json().catch(() => ({}));
  const parse = addToCartSchema.safeParse({
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

  // Validasi produk aktif
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true, stock: true },
  });
  if (!product || !product.isActive)
    return new Response("Product not available", { status: 409 });

  const cartId = await ensureCart(user.id);

  // Upsert item
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId },
    select: { id: true, qty: true },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + qty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, qty },
    });
  }

  return json({ ok: true });
}

/** DELETE /api/cart → kosongkan cart user */
export async function DELETE(_req: NextRequest) {
  const user = await getCurrentUser({ withFullUser: false });
  if (!user) return new Response("Unauthorized", { status: 401 });

  await prisma.cart
    .delete({ where: { customerId: user.id } })
    .catch(() => null);
  return json({ ok: true });
}
