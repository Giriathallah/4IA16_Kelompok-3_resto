"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ReceiptText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"; // ⬅️ tambahkan ini
import { logOut } from "@/actions/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produk", label: "Produk", icon: Package },
  { href: "/admin/pesanan", label: "Pesanan", icon: ReceiptText },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pb-2 pt-4">
        <div className="text-xs text-muted-foreground">Navigation</div>
      </div>

      <ScrollArea className="px-2">
        <nav className="grid gap-1 p-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
            const active =
              pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-4" />
                <span className="flex-1">{label}</span>
                {badge ? <Badge variant="secondary">{badge}</Badge> : null}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 pb-3">
        <form action={logOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3"
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </form>
      </div>

      <div className="px-3 pb-4 text-xs text-muted-foreground">
        <div>Dapur Bunda POS </div>
      </div>
    </div>
  );
}
