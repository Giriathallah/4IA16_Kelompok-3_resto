"use client";

import { useState, useEffect } from "react";
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
import { Edit, Plus, Boxes, Search, RefreshCcw } from "lucide-react";

import {
  ProductFormDialog,
  type Product as ProductFormType,
} from "@/components/admin/profuctForm";
import { StockDrawer } from "@/components/admin/stocksDrawer";
import { toast } from "sonner";

type Category = "MAIN" | "APPETIZER" | "DRINK";
const CATEGORIES: Category[] = ["MAIN", "APPETIZER", "DRINK"];

type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  isActive: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  items: Product[];
  page: number;
  perPage: number;
  total: number;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function buildQuery(params: {
  q?: string;
  category?: "all" | Category;
  active?: "all" | "active" | "inactive";
  page?: number;
  perPage?: number;
  sort?:
    | "createdAt_desc"
    | "name_asc"
    | "name_desc"
    | "price_asc"
    | "price_desc";
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category && params.category !== "all")
    sp.set("category", params.category);
  if (params.active && params.active !== "all") {
    sp.set("active", params.active === "active" ? "true" : "false");
  }
  if (params.page) sp.set("page", String(params.page));
  if (params.perPage) sp.set("perPage", String(params.perPage));
  if (params.sort) sp.set("sort", params.sort);
  return sp.toString();
}

async function fetchProducts(params: {
  signal?: AbortSignal;
  q?: string;
  category?: "all" | Category;
  active?: "all" | "active" | "inactive";
  page?: number;
  perPage?: number;
}) {
  const qs = buildQuery({ ...params, sort: "createdAt_desc" });
  const res = await fetch(`/api/products?${qs}`, {
    signal: params.signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Gagal memuat produk (${res.status})`);
  const data: ListResponse = await res.json();
  return data;
}

async function createProduct(
  payload: Omit<ProductFormType, "id" | "createdAt">
) {
  // Catatan: payload sudah berisi imageUrl dari ProductForm (Cloudinary)
  const res = await fetch(`/api/products`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Gagal membuat produk");
  }
  return res.json();
}

async function updateProduct(
  id: string,
  payload: Partial<Omit<ProductFormType, "id" | "createdAt">>
) {
  const res = await fetch(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Gagal memperbarui produk");
  }
  return res.json();
}

async function adjustStock(
  id: string,
  body: { type: "IN" | "OUT" | "ADJUSTMENT"; qty: number; note?: string }
) {
  const res = await fetch(`/api/products/${id}/stock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? "Gagal mengubah stok");
  }
  return res.json();
}

// ===== Page =====
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

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  // dialogs/drawers
  const [openForm, setOpenForm] = useState(false);
  const [editTarget, setEditTarget] = useState<ProductFormType | undefined>(
    undefined
  );
  const [openStock, setOpenStock] = useState(false);
  const [stockTarget, setStockTarget] = useState<Product | undefined>(
    undefined
  );

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(search.toString());
    p.set(key, val);
    if (!["page", "perPage"].includes(key)) p.set("page", "1");
    router.replace(`/admin/produk?${p.toString()}`);
  }

  // Fetch from API
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetchProducts({
      signal: ctrl.signal,
      q,
      category,
      active,
      page,
      perPage,
    })
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
      })
      .catch((e: any) => {
        if (e.name !== "AbortError") {
          toast.error("Gagal Memuat");
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, category, active, page, perPage, toast]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Handlers
  function onClickAdd() {
    setEditTarget(undefined);
    setOpenForm(true);
  }
  function onClickEdit(p: Product) {
    // map ke tipe ProductForm dialog
    const { id, name, price, category, stock, isActive, imageUrl, createdAt } =
      p;
    setEditTarget({
      id,
      name,
      price,
      category,
      stock,
      isActive,
      imageUrl: imageUrl ?? undefined,
      createdAt,
    });
    setOpenForm(true);
  }
  function onClickStock(p: Product) {
    setStockTarget(p);
    setOpenStock(true);
  }

  async function handleSubmitProduct(
    payload: Omit<ProductFormType, "id" | "createdAt"> & { id?: string }
  ) {
    try {
      // payload.imageUrl sudah berasal dari hasil upload Cloudinary di ProductForm
      if (payload.id) {
        await updateProduct(payload.id, payload);
        toast.success("Produk diperbarui");
      } else {
        await createProduct(payload);
        toast.success("Produk dibuat");
      }
      setOpenForm(false);

      // refetch
      const ctrl = new AbortController();
      setLoading(true);
      const data = await fetchProducts({
        signal: ctrl.signal,
        q,
        category,
        active,
        page,
        perPage,
      });
      setRows(data.items);
      setTotal(data.total);
      setLoading(false);
    } catch (e: any) {
      toast.error("gagal memperbarui produk");
    }
  }

  async function handleSubmitStock({
    type,
    qty,
    note,
  }: {
    type: "IN" | "OUT" | "ADJUSTMENT";
    qty: number;
    note?: string;
  }) {
    if (!stockTarget) return;
    try {
      await adjustStock(stockTarget.id, { type, qty, note });
      toast.success("Stok diperbarui");
      setOpenStock(false);

      // refetch
      const ctrl = new AbortController();
      setLoading(true);
      const data = await fetchProducts({
        signal: ctrl.signal,
        q,
        category,
        active,
        page,
        perPage,
      });
      setRows(data.items);
      setTotal(data.total);
      setLoading(false);
    } catch (e: any) {
      toast.error("gagal memperbarui stok");
    }
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
              onClick={() => router.replace("/admin/produk")}
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
                {Array.from({
                  length: Math.min(5, Math.max(1, Math.ceil(total / perPage))),
                }).map((_, i) => {
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
                    aria-disabled={page >= Math.ceil(total / perPage)}
                    tabIndex={page >= Math.ceil(total / perPage) ? -1 : 0}
                    onClick={() =>
                      page < Math.ceil(total / perPage) &&
                      setParam("page", String(page + 1))
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <ProductFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        initial={editTarget}
        onSubmit={handleSubmitProduct}
      />

      <StockDrawer
        open={openStock}
        onOpenChange={setOpenStock}
        productName={stockTarget?.name ?? ""}
        currentStock={stockTarget?.stock ?? 0}
        onSubmit={handleSubmitStock}
      />
    </div>
  );
}
