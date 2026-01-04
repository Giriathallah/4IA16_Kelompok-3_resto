"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Edit,
  Plus,
  PackagePlus,
  Boxes,
  Search,
  RefreshCcw,
} from "lucide-react";

import {
  ProductFormDialog,
  type Product,
} from "@/components/admin/profuctForm";
import { StockDrawer } from "@/components/admin/stocksDrawer";

// ===== Dummy data & utils =====
type Category = "MAIN" | "APPETIZER" | "DRINK";
const CATEGORIES: Category[] = ["MAIN", "APPETIZER", "DRINK"];

const MOCK_PRODUCTS: Product[] = Array.from({ length: 37 }).map((_, i) => ({
  id: crypto.randomUUID(),
  name:
    ["Nasi Goreng", "Es Teh Manis", "Mie Ayam", "Kopi Susu", "Pisang Goreng"][
      i % 5
    ] +
    " " +
    (i + 1),
  price: [25000, 8000, 20000, 18000, 12000][i % 5],
  category: CATEGORIES[i % 4],
  stock: [12, 0, 45, 6, 20][i % 5],
  isActive: i % 7 !== 0,
  createdAt: new Date(Date.now() - i * 864e5).toISOString(),
}));

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// TODO: replace with real fetch
async function fetchProductsStub(): Promise<Product[]> {
  return new Promise((res) => setTimeout(() => res(MOCK_PRODUCTS), 300));
}

// TODO: replace with real mutations
async function upsertProductStub(
  _: Omit<Product, "id" | "createdAt"> & { id?: string }
) {
  await new Promise((r) => setTimeout(r, 350));
}
async function adjustStockStub(_: {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT";
  qty: number;
  note?: string;
}) {
  await new Promise((r) => setTimeout(r, 350));
}

export default function ProductsPage() {
  const router = useRouter();
  const search = useSearchParams();

  // URL params
  const q = search.get("q") ?? "";
  const category = (search.get("category") ?? "all") as "all" | Category;
  const active = (search.get("active") ?? "all") as
    | "all"
    | "active"
    | "inactive";
  const page = Number(search.get("page") ?? "1");
  const perPage = Number(search.get("perPage") ?? "10");

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Product[]>([]);
  const [total, setTotal] = React.useState(0);

  // dialogs/drawers
  const [openForm, setOpenForm] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Product | undefined>(
    undefined
  );
  const [openStock, setOpenStock] = React.useState(false);
  const [stockTarget, setStockTarget] = React.useState<Product | undefined>(
    undefined
  );

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(search.toString());
    p.set(key, val);
    if (!["page", "perPage"].includes(key)) p.set("page", "1");
    router.replace(`/products?${p.toString()}`);
  }

  React.useEffect(() => {
    setLoading(true);
    fetchProductsStub()
      .then((data) => {
        const qLower = q.toLowerCase();
        let filtered = data.filter((p) =>
          p.name.toLowerCase().includes(qLower)
        );
        if (category !== "all")
          filtered = filtered.filter((p) => p.category === category);
        if (active !== "all")
          filtered = filtered.filter((p) =>
            active === "active" ? p.isActive : !p.isActive
          );

        setTotal(filtered.length);
        const start = (page - 1) * perPage;
        setRows(filtered.slice(start, start + perPage));
      })
      .finally(() => setLoading(false));
  }, [q, category, active, page, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Handlers
  function onClickAdd() {
    setEditTarget(undefined);
    setOpenForm(true);
  }
  function onClickEdit(p: Product) {
    setEditTarget(p);
    setOpenForm(true);
  }
  function onClickStock(p: Product) {
    setStockTarget(p);
    setOpenStock(true);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Produk</CardTitle>
          <div className="flex gap-2">
            <Button onClick={onClickAdd}>
              <Plus className="mr-2 size-4" /> Tambah Produk
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari nama produk…"
                defaultValue={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>

            <Select
              value={category}
              onValueChange={(v) => setParam("category", v)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={active} onValueChange={(v) => setParam("active", v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              onClick={() => router.replace("/products")}
            >
              <RefreshCcw className="mr-2 size-4" /> Reset
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: perPage }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-56" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-28 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>{formatIDR(p.price)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={
                                  p.stock > 0
                                    ? ""
                                    : "text-destructive font-medium"
                                }
                              >
                                {p.stock}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Stok tersisa</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onClickStock(p)}
                          >
                            <Boxes className="mr-2 size-4" /> Stok
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onClickEdit(p)}
                          >
                            <Edit className="mr-2 size-4" /> Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : 0}
                    onClick={() =>
                      page > 1 && setParam("page", String(page - 1))
                    }
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={p === page}
                        onClick={() => setParam("page", String(p))}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    aria-disabled={page >= totalPages}
                    tabIndex={page >= totalPages ? -1 : 0}
                    onClick={() =>
                      page < totalPages && setParam("page", String(page + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs / Drawers */}
      <ProductFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        initial={editTarget}
        onSubmit={async (payload) => {
          // TODO: Replace with real mutation
          await upsertProductStub(payload);
        }}
      />

      <StockDrawer
        open={openStock}
        onOpenChange={setOpenStock}
        productName={stockTarget?.name ?? ""}
        currentStock={stockTarget?.stock ?? 0}
        onSubmit={async ({ type, qty, note }) => {
          if (!stockTarget) return;
          // TODO: Replace with real mutation
          await adjustStockStub({ id: stockTarget.id, type, qty, note });
        }}
      />
    </div>
  );
}
