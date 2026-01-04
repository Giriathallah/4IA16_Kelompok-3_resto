// lib/auth/get-current-user.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSession } from "./session";
import prisma from "../prisma";
import { cache } from "react";

type FullUser = Exclude<
  Awaited<ReturnType<typeof getUserFromDb>>,
  null | undefined
>;

type User = Exclude<
  Awaited<ReturnType<typeof getUserFromSession>>,
  null | undefined
>;

function _getCurrentUser(options: {
  withFullUser: true;
  redirectIfNotFound: true;
}): Promise<FullUser>;
function _getCurrentUser(options: {
  withFullUser: true;
  redirectIfNotFound?: false;
}): Promise<FullUser | null>;
function _getCurrentUser(options: {
  withFullUser?: false;
  redirectIfNotFound: true;
}): Promise<User>;
function _getCurrentUser(options?: {
  withFullUser?: false;
  redirectIfNotFound?: false;
}): Promise<User | null>;
async function _getCurrentUser({
  withFullUser = false,
  redirectIfNotFound = false,
} = {}) {
  const user = await getUserFromSession(await cookies());

  if (!user) {
    if (redirectIfNotFound) redirect("/sign-in");
    return null;
  }

  if (withFullUser) {
    const fullUser = await getUserFromDb(user.id);
    if (!fullUser) throw new Error("User not found in database");
    return fullUser;
  }

  return user;
}

export const getCurrentUser = cache(_getCurrentUser);

async function getUserFromDb(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
    },
  });
}
