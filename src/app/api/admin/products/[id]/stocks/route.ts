import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

// qty sering datang sebagai string, pakai coerce agar aman
const stockAdjustmentSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  qty: z.coerce.number().int().positive("Kuantitas harus lebih dari 0"),
  note: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params; // "id" sesuai nama folder [id]
    if (!id) {
      return NextResponse.json(
        { error: "Product ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const parse = stockAdjustmentSchema.safeParse(json);
    if (!parse.success) {
      return NextResponse.json(
        { error: "Input tidak valid", details: parse.error.format() },
        { status: 422 }
      );
    }

    const { type, qty, note } = parse.data;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hitung stok baru
    let newStock = product.stock;
    switch (type) {
      case "IN":
        newStock = product.stock + qty;
        break;
      case "OUT":
        newStock = product.stock - qty;
        break;
      case "ADJUSTMENT":
        newStock = qty;
        break;
    }
    if (newStock < 0) {
      return NextResponse.json(
        { error: "Stok produk tidak boleh negatif" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          productId: id,
          type,
          qty,
          note,
        },
      });

      return updatedProduct;
    });

    return NextResponse.json(
      { message: "Stok berhasil diperbarui", product: updated },
      { status: 200 }
    );
  } catch (e) {
    console.error("[ADMIN_PRODUCTS_STOCKS_POST]", e);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
