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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Search, RefreshCcw, Eye, CheckCircle2, Loader2 } from "lucide-react";

type OrderStatus = "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
type DiningType = "DINE_IN" | "TAKE_AWAY";

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
};

type Payment = {
  id: string;
  method: "CASH" | "QRIS" | "CARD" | "BANK_TRANSFER";
  amount: number;
  refCode?: string;
  paidAt: string;
};

type Order = {
  id: string;
  code: string;
  queueNumber: string;
  serviceDate: string;
  status: OrderStatus;
  diningType: DiningType;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  customerName: string;
  items: OrderItem[];
  payments: Payment[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

async function fetchOrders(params: {
  q?: string;
  status?: "all" | OrderStatus;
  dining?: "all" | DiningType;
  range?: "today" | "7d" | "30d" | "all";
  page?: number;
  perPage?: number;
}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (params.dining) sp.set("dining", params.dining);
  if (params.range) sp.set("range", params.range);
  if (params.page) sp.set("page", String(params.page));
  if (params.perPage) sp.set("perPage", String(params.perPage));

  const res = await fetch(`/api/admin/orders?${sp.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Gagal memuat (${res.status})`);
  }
  return res.json() as Promise<{
    items: Order[];
    page: number;
    perPage: number;
    total: number;
  }>;
}

async function setPaidCash(orderId: string, receivedAmount: number) {
  const res = await fetch(`/api/admin/orders/${orderId}/pay-cash`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: receivedAmount }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Gagal set paid cash");
  }
  return res.json();
}

function StatusBadge({ s }: { s: OrderStatus }) {
  const map: Record<
    OrderStatus,
    { v: "default" | "secondary" | "destructive"; label: string }
  > = {
    OPEN: { v: "secondary", label: "OPEN" },
    AWAITING_PAYMENT: { v: "secondary", label: "AWAITING_PAYMENT" },
    PAID: { v: "default", label: "PAID" },
    CANCELLED: { v: "destructive", label: "CANCELLED" },
  };
  const { v, label } = map[s];
  return <Badge variant={v}>{label}</Badge>;
}
function DiningBadge({ d }: { d: DiningType }) {
  return (
    <Badge className="bg-primary/10 text-primary border border-primary/20">
      {d === "DINE_IN" ? "Dine-in" : "Take-away"}
    </Badge>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const search = useSearchParams();

  const q = search.get("q") ?? "";
  const status = (search.get("status") ?? "all") as "all" | OrderStatus;
  const dining = (search.get("dining") ?? "all") as "all" | DiningType;
  const range = (search.get("range") ?? "7d") as "today" | "7d" | "30d" | "all";
  const page = Number(search.get("page") ?? "1");
  const perPage = Number(search.get("perPage") ?? "10");

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState(0);

  const [openSheet, setOpenSheet] = React.useState(false);
  const [detail, setDetail] = React.useState<Order | null>(null);

  const [cashInput, setCashInput] = React.useState<string>("");
  const receivedAmount = Number(cashInput || "0");
  const change =
    Math.max(0, (detail?.total ?? 0) - receivedAmount) === 0
      ? receivedAmount - (detail?.total ?? 0)
      : 0;
  const kurang = Math.max(0, (detail?.total ?? 0) - receivedAmount);
  const [paying, setPaying] = React.useState(false);
  const [version, setVersion] = React.useState(0);

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(search.toString());
    p.set(key, val);
    if (!["page", "perPage"].includes(key)) p.set("page", "1");
    router.replace(`/admin/pesanan?${p.toString()}`);
  }

  async function load() {
    setLoading(true);
    const { items, total } = await fetchOrders({
      q,
      status,
      dining,
      range,
      page,
      perPage,
    });
    setRows(items);
    setTotal(total);
    setLoading(false);
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, dining, range, page, perPage, version]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const canCashPay =
    !!detail &&
    (detail.status === "OPEN" || detail.status === "AWAITING_PAYMENT") &&
    detail.payments.length === 0;

  async function handleSetPaidCash() {
    if (!detail) return;
    if (receivedAmount < detail.total) {
      window.alert("Uang diterima kurang dari total.");
      return;
    }
    try {
      setPaying(true);
      await setPaidCash(detail.id, receivedAmount);

      setOpenSheet(false);
      setDetail(null);
      setCashInput("");
      setVersion((v) => v + 1);
      window.alert("Order ditandai sebagai PAID (Cash).");
    } catch (e: any) {
      window.alert(e?.message ?? "Gagal set paid.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Pesanan</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.replace("/admin/pesanan")}
            >
              <RefreshCcw className="mr-2 size-4" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari kode / pelanggan…"
                defaultValue={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={(v) => setParam("status", v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="OPEN">OPEN</SelectItem>
                <SelectItem value="AWAITING_PAYMENT">
                  AWAITING_PAYMENT
                </SelectItem>
                <SelectItem value="PAID">PAID</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dining} onValueChange={(v) => setParam("dining", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipe Layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="DINE_IN">Dine-in</SelectItem>
                <SelectItem value="TAKE_AWAY">Take-away</SelectItem>
              </SelectContent>
            </Select>

            <Select value={range} onValueChange={(v) => setParam("range", v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rentang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari ini</SelectItem>
                <SelectItem value="7d">7 hari</SelectItem>
                <SelectItem value="30d">30 hari</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: perPage }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.code}</TableCell>
                      <TableCell>{o.queueNumber}</TableCell>
                      <TableCell>
                        {new Date(o.createdAt).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>
                        <DiningBadge d={o.diningType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge s={o.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(o.total)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setDetail(o);
                                  setOpenSheet(true);
                                }}
                              >
                                <Eye className="size-4 mr-2" /> Detail
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Lihat item & pembayaran
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {o.payments.length === 0 &&
                          (o.status === "OPEN" ||
                            o.status === "AWAITING_PAYMENT") && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setDetail(o);
                                setOpenSheet(true);
                                setCashInput(String(o.total));
                              }}
                            >
                              <CheckCircle2 className="size-4 mr-2" />
                              Mark Paid (Cash)
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
                  length: Math.max(1, Math.min(6, Math.ceil(total / perPage))),
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

      <Sheet
        open={openSheet}
        onOpenChange={(open) => {
          setOpenSheet(open);
          if (!open) {
            setDetail(null);
            setCashInput("");
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Detail Pesanan</SheetTitle>
          </SheetHeader>
          {!detail ? null : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-1">
                <div className="text-sm text-muted-foreground">Kode</div>
                <div className="font-medium">{detail.code}</div>
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground">Pelanggan</div>
                  <div className="font-medium">{detail.customerName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>
                    <StatusBadge s={detail.status} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tipe</div>
                  <div>
                    <DiningBadge d={detail.diningType} />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Waktu</div>
                  <div>
                    {new Date(detail.createdAt).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="px-4 py-2 font-medium">Items</div>
                <div className="divide-y">
                  {detail.items.map((it) => (
                    <div
                      key={it.id}
                      className="px-4 py-2 text-sm flex items-center justify-between"
                    >
                      <div className="mr-2">
                        <div className="font-medium">{it.name}</div>
                        <div className="text-muted-foreground">
                          Qty {it.qty} × {formatIDR(it.price)}
                        </div>
                      </div>
                      <div className="font-medium">{formatIDR(it.total)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatIDR(detail.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>-{formatIDR(detail.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak</span>
                  <span>{formatIDR(detail.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatIDR(detail.total)}</span>
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="px-4 py-2 font-medium">Pembayaran</div>
                {detail.payments.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Belum ada pembayaran
                  </div>
                ) : (
                  <div className="divide-y">
                    {detail.payments.map((p) => (
                      <div
                        key={p.id}
                        className="px-4 py-2 text-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{p.method}</div>
                          <div className="text-muted-foreground">
                            {p.refCode ?? "—"} ·{" "}
                            {new Date(p.paidAt).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="font-medium">{formatIDR(p.amount)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(detail.status === "OPEN" ||
                detail.status === "AWAITING_PAYMENT") && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="font-medium">Tandai Lunas (Cash)</div>
                  <div className="grid gap-2">
                    <Label htmlFor="cash">Uang Diterima</Label>
                    <Input
                      id="cash"
                      type="number"
                      min={0}
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      placeholder={String(detail.total)}
                    />
                  </div>
                  <div className="text-sm">
                    {receivedAmount >= (detail.total ?? 0) ? (
                      <span>
                        Kembalian:{" "}
                        <span className="font-semibold">
                          {formatIDR(receivedAmount - detail.total)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-destructive">
                        Kurang: {formatIDR(kurang)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCashInput(String(detail.total));
                      }}
                    >
                      Isi Total
                    </Button>
                    <Button
                      onClick={handleSetPaidCash}
                      disabled={
                        paying ||
                        !canCashPay ||
                        !Number.isFinite(receivedAmount) ||
                        receivedAmount < detail.total
                      }
                    >
                      {paying ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Memproses…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 size-4" />
                          Mark as Paid (Cash)
                        </>
                      )}
                    </Button>
                  </div>
                  {!canCashPay && (
                    <div className="text-xs text-muted-foreground">
                      Tombol dinonaktifkan karena order sudah dibayar atau ada
                      payment non-tunai.
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setOpenSheet(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
