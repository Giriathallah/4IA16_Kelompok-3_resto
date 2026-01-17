/**
 * @fileoverview Prisma Client Singleton
 * @module lib/prisma
 * @description Modul untuk menginisialisasi dan mengekspor Prisma Client
 *              dengan pattern singleton untuk mencegah multiple instances
 *              di development mode (hot reload)
 */

import { PrismaClient } from "@/generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";

/**
 * Instance Prisma Client dengan extension Accelerate
 * @constant
 * @private
 */
const _prisma = new PrismaClient().$extends(withAccelerate());

/**
 * Global object untuk menyimpan instance Prisma
 * Digunakan untuk singleton pattern di development
 * @private
 */
const globalForPrisma = globalThis as unknown as { prisma?: typeof _prisma };

// Di development, simpan instance ke global untuk mencegah
// multiple connections saat hot reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = _prisma;
}

/**
 * Prisma Client instance (default export)
 * Gunakan untuk semua operasi database
 *
 * @example
 * import prisma from "@/lib/prisma";
 * const users = await prisma.user.findMany();
 */
export default _prisma;

/**
 * Prisma Client instance (named export)
 * Alternative import untuk compatibility
 *
 * @example
 * import { prisma } from "@/lib/prisma";
 * const users = await prisma.user.findMany();
 */
export const prisma = _prisma;

