// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const userSession = await getCurrentUser({ withFullUser: true });
    if (!userSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = userSession.email;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profileData = {
      username: user.name || user.email.split("@")[0],
      name: user.name,
      avatar: user.avatarUrl,
      email: user.email,
      role: user.role,
    };

    const res = NextResponse.json(profileData);
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (err) {
    console.error("[PROFILE_GET]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
