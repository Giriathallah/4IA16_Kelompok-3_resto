"use client";

import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart, CartProvider } from "@/lib/cart";

type Me = {
  username: string;
  name: string | null;
  avatar: string | null;
  email: string;
  role?: "admin" | "user";
};

function Header() {
  const { count } = useCart();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/user", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Me;
        if (alive) setMe(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const isAdmin = me?.role === "admin";

  return (
    <div className="bg-card border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          RestaurantApp
        </Link>

        <div className="flex items-center gap-3">
          {/* Jika admin & sedang berada di path user (mis. "/" atau halaman user lain), tampilkan tombol Dashboard */}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Dashboard
            </Link>
          )}

          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-accent"
            aria-label="Profile"
          >
            <User className="w-6 h-6" />
          </Link>

          <Link
            href="/cart"
            className="relative p-2 rounded-lg hover:bg-accent"
            aria-label="Cart"
          >
            <ShoppingCart className="w-6 h-6" />
            {count() > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count()}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="min-h-screen bg-background">{children}</main>
    </CartProvider>
  );
}
