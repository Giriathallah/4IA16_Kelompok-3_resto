// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import {
  getUserFromSession,
  updateUserSessionExpiration,
} from "./lib/auth/session-edge";

export async function middleware(request: NextRequest) {
  // Jalankan auth untuk 3 grup halaman yg diproteksi
  const res = await guardPages(request);
  const response = res ?? NextResponse.next();

  // Perpanjang masa berlaku sesi bila ada
  await updateUserSessionExpiration({
    get: (key) => request.cookies.get(key),
    set: (key, value, options) => {
      response.cookies.set({ ...options, name: key, value });
    },
  });

  return response;
}

async function guardPages(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminPath = pathname.startsWith("/admin");
  const isCartPath = pathname.startsWith("/cart");
  const isProfilePath = pathname.startsWith("/profile");

  const user = await getUserFromSession(request.cookies);

  if (!user && (isAdminPath || isCartPath || isProfilePath)) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  if (user && isAdminPath && user.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return null;
}

export const config = {
  matcher: ["/admin/:path*", "/cart/:path*", "/profile/:path*"],
};
