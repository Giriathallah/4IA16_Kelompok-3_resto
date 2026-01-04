// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma"; // atau "@prisma/client" jika tidak generate ke src/generated
import { withAccelerate } from "@prisma/extension-accelerate";

const _prisma = new PrismaClient().$extends(withAccelerate());

const globalForPrisma = globalThis as unknown as { prisma?: typeof _prisma };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = _prisma;
}

export default _prisma; // default export
export const prisma = _prisma; // named export (tambahan penting)
