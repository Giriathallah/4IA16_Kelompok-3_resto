import crypto from "crypto";
import { redisClient } from "@/redis/redis";
import { z } from "zod";

// seven days in seconds
const SESSION_EXPIRATION_SECONDS = 60 * 60 * 60 * 24 * 7;
const COOKIE_SESSION_KEY = "session_id";

const sessionSchema = z.object({
  id: z.string(),
  role: z.enum(["admin", "user"]),
});

export type UserSession = z.infer<typeof sessionSchema>;

export type Cookies = {
  set: (
    key: string,
    value: string,
    options?: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "strict" | "lax";
      expires?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

export async function createUserSession(
  user: UserSession,
  cookies: Pick<Cookies, "set">
) {
  const sessionId = crypto.randomBytes(512).toString("hex").normalize();
  await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  });

  setCookie(sessionId, cookies);
}

export async function getUserFromSession(cookies: Pick<Cookies, "get">) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  return getUserSessionById(sessionId);
}

export async function updateUserSessionExpiration(
  cookies: Pick<Cookies, "get" | "set">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  const user = await getUserSessionById(sessionId);
  if (!user) return null;

  await redisClient.set(`session:${sessionId}`, user, {
    ex: SESSION_EXPIRATION_SECONDS,
  });
  setCookie(sessionId, cookies);
}

export async function removeUserFromSession(
  cookies: Pick<Cookies, "get" | "delete">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionId) return null;

  await redisClient.del(`session:${sessionId}`);
  cookies.delete(COOKIE_SESSION_KEY);
}

function setCookie(sessionId: string, cookies: Pick<Cookies, "set">) {
  cookies.set(COOKIE_SESSION_KEY, sessionId, {
    secure: true,
    httpOnly: true,
    sameSite: "lax",
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

// get user session by id in redis
async function getUserSessionById(sessionId: string) {
  const rawUser = await redisClient.get(`session:${sessionId}`);

  const { success, data: user } = sessionSchema.safeParse(rawUser);

  return success ? user : null;
}

export async function updateUserSessionData(
  user: UserSession,
  cookies: Pick<Cookies, "get">
) {
  const sessionId = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (sessionId == null) return null;

  await redisClient.set(`session:${sessionId}`, sessionSchema.parse(user), {
    ex: SESSION_EXPIRATION_SECONDS,
  });
}
