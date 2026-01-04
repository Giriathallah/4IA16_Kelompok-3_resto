"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex h-14 items-center gap-3 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link
            href="/admin"
            className="font-semibold text-base sm:text-lg"
            aria-label="Admin Home"
          >
            Dapur Bunda • Admin
          </Link>

          <Separator
            orientation="vertical"
            className="mx-2 h-6 hidden sm:block"
          />

          <div className="text-sm text-muted-foreground truncate">
            {pathname?.split("/").filter(Boolean).slice(-1)[0] ?? "dashboard"}
          </div>

          <div className="ml-auto flex items-center gap-2">{/* actions */}</div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden md:block w-64 shrink-0 border-r bg-card/40">
          <Sidebar />
        </aside>

        <main className="flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <Suspense fallback={<div>Loading…</div>}>{children}</Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
