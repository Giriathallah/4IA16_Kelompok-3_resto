// app/api/products/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { json, error, parsePagination } from "@/lib/http";
import { productCreateSchema, CategoryEnum } from "@/lib/validators/product";
import type { Prisma } from "@/generated/prisma";
import { Category } from "@/generated/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category");
  const active = searchParams.get("active");
  const sortParam = (
    searchParams.get("sort") ?? "createdAt_desc"
  ).toLowerCase();
  const { skip, take, page, perPage } = parsePagination(searchParams);

  const where: Prisma.ProductWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  if (
    category &&
    (CategoryEnum.options as readonly string[]).includes(category)
  ) {
    where.category = category as Category;
  }

  if (active === "true") where.isActive = true;
  if (active === "false") where.isActive = false;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sortParam === "name_asc"
      ? { name: "asc" }
      : sortParam === "name_desc"
      ? { name: "desc" }
      : sortParam === "price_asc"
      ? { price: "asc" }
      : sortParam === "price_desc"
      ? { price: "desc" }
      : { createdAt: "desc" }; // default

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
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
    }),
    prisma.product.count({ where }),
  ]);

  return json({ items, page, perPage, total });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = productCreateSchema.safeParse({
    ...body,
    price: typeof body?.price === "string" ? Number(body.price) : body?.price,
    stock: typeof body?.stock === "string" ? Number(body.stock) : body?.stock,
  });
  if (!parsed.success) {
    return error("Invalid payload", 422, { issues: parsed.error.flatten() });
  }

  const data = parsed.data;
  const created = await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      category: data.category, // Prisma enum → Postgres enum
      stock: data.stock ?? 0,
      isActive: data.isActive ?? true,
      imageUrl: data.imageUrl || null,
    },
    select: { id: true },
  });

  return json({ id: created.id }, 201);
}
