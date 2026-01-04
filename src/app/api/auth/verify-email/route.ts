// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/token";
import prisma from "@/lib/prisma";
import { createUserSession } from "@/lib/auth/session";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Invalid token", req.url)
    );
  }

  try {
    const userId = await verifyToken(token);

    if (!userId || typeof userId !== "string") {
      return NextResponse.redirect(
        new URL("/auth/error?message=Invalid or expired token", req.url)
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
      select: { id: true, email: true, role: true },
    });

    await createUserSession(user, await cookies());

    return NextResponse.redirect(
      new URL("/auth/verification-success", req.url) // Redirect ke halaman sukses
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?message=Verification failed", req.url)
    );
  }
}
