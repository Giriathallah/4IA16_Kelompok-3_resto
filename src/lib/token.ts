// lib/token.ts
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import { redisClient as redis } from "@/redis/redis";

const VERIFICATION_TOKEN_EXPIRATION_SECONDS = 24 * 60 * 60; // 24 jam

/**
 * Simpan token ke Redis (untuk lookup cepat) + DB (fallback / audit).
 * Penting: VerificationToken di DB mewajibkan userId.
 */
export async function generateVerificationToken(userId: string) {
  const token = uuidv4();
  const expires = new Date(
    Date.now() + VERIFICATION_TOKEN_EXPIRATION_SECONDS * 1000
  );

  // Cache di Redis (opsional tapi cepat)
  await redis.set(`verification:${token}`, userId, {
    ex: VERIFICATION_TOKEN_EXPIRATION_SECONDS,
  });

  // Simpan ke DB — WAJIB sertakan userId sesuai schema
  const dbToken = await prisma.verificationToken.create({
    data: {
      userId, // <-- WAJIB (foreign key)
      identifier: userId, // boleh userId / email / "EMAIL_VERIFY" (sesuai kebutuhan kamu)
      token, // unik
      expires,
    },
  });

  return dbToken;
}

/**
 * Verifikasi token: cek Redis dulu, kalau tidak ada, cek DB.
 * Return: userId jika valid; null jika invalid/expired.
 */
export async function verifyToken(token: string) {
  const userId = await redis.get(`verification:${token}`);

  if (userId) {
    // Bersihkan Redis + DB
    await redis.del(`verification:${token}`);
    await prisma.verificationToken.deleteMany({
      where: { token, identifier: userId },
    });
    return userId;
  }

  // Fallback: cek DB (token unik)
  const dbToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (dbToken && dbToken.expires > new Date()) {
    await prisma.verificationToken.delete({
      where: { token },
    });
    return dbToken.userId; // <- gunakan userId dari DB
  }

  return null;
}
