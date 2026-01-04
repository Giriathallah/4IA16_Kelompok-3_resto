// api/oauth/[provider]/route.ts
import { getOAuthClient } from "@/lib/auth/oauth/base";
import { createUserSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { OAuthProvider } from "@/generated/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { z } from "zod";

// Define valid OAuth providers based on your Prisma enum
const oAuthProviders = Object.values(OAuthProvider) as [
  OAuthProvider,
  ...OAuthProvider[]
];

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider: rawProvider } = params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  // Validate provider
  const provider = z.enum(oAuthProviders).parse(rawProvider);

  if (typeof code !== "string" || typeof state !== "string") {
    redirect(
      `/sign-in?oauthError=${encodeURIComponent(
        "Failed to connect. Please try again."
      )}`
    );
  }

  const oAuthClient = getOAuthClient(provider);

  try {
    const oAuthUser = await oAuthClient.fetchUser(code, state, await cookies());
    const user = await connectUserToAccount(oAuthUser, provider);
    await createUserSession(user, await cookies());
  } catch (error) {
    console.error("OAuth callback error:", error);
    redirect(
      `/sign-in?oauthError=${encodeURIComponent(
        "Failed to connect. Please try again."
      )}`
    );
  }

  redirect("/");
}

async function connectUserToAccount(
  { id, email, name }: { id: string; email: string; name: string },
  provider: OAuthProvider
) {
  return await prisma.$transaction(async (tx) => {
    // Check if user exists
    let user = await tx.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await tx.user.create({
        data: {
          email,
          name,
          // Add any other default fields you need
          role: "user", // Default role
        },
        select: { id: true, role: true },
      });
    }

    // Connect OAuth account
    await tx.userOAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: id,
        },
      },
      update: {
        userId: user.id,
      },
      create: {
        provider,
        providerAccountId: id,
        userId: user.id,
      },
    });

    return user;
  });
}
