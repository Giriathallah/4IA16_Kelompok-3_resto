"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { CreditCard, ReceiptText, TrendingUp, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Label,
} from "recharts";

// ===== Tipe Data =====
type OrderRow = {
  code: string;
  createdAt: string;
  customer: string;
  status: "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
  total: number;
  method?: "CASH" | "MIDTRANS" | "QRIS";
};

type KpiData = {
  revenue: number;
  orders: number;
  aov: number;
  customers: number;
};

type SeriesData = {
  d: string;
  v: number;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

// ===== Halaman Komponen =====
export default function DashboardPage() {
  const router = useRouter();
  const search = useSearchParams();

  // URL State
  const page = Number(search.get("page") ?? "1");
  const perPage = Number(search.get("perPage") ?? "8");
  const range = (search.get("range") ?? "7d") as "7d" | "30d";
  const sort = search.get("sort") ?? "newest";

  // Component State
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [kpi, setKpi] = useState<KpiData>({
    revenue: 0,
    orders: 0,
    aov: 0,
    customers: 0,
  });
  const [series, setSeries] = useState<SeriesData[]>([]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sort,
      range,
    });
    // Fetch ke API yang sudah dibuat
    fetch(`/api/admin/dashboard?${q.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        // 1. Set data KPI
        setKpi(data.kpi ?? { revenue: 0, orders: 0, aov: 0, customers: 0 });

        // 2. Set data tabel pesanan
        setRows(data.orders?.rows ?? []);
        setTotal(data.orders?.total ?? 0);

        // 3. Set data grafik & format agar sesuai
        const rawSeries =
          range === "30d" ? data.series.days30 : data.series.days7;
        const formattedSeries = (rawSeries || []).map(
          (item: { date: string; value: number }) => ({
            d: new Date(item.date).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
            }),
            v: item.value / 1000, // Tampilkan dalam ribuan
          })
        );
        setSeries(formattedSeries);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, perPage, sort, range]);

  const setParam = (key: string, val: string) => {
    const p = new URLSearchParams(search.toString());
    p.set(key, val);
    if (key !== "page") p.set("page", "1");
    router.replace(`/admin?${p.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Top row KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Omzet</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <div className="text-2xl font-bold">{formatIDR(kpi.revenue)}</div>
            )}
            <TrendingUp className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Jumlah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{kpi.orders}</div>
            )}
            <ReceiptText className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AOV</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">{formatIDR(kpi.aov)}</div>
            )}
            <CreditCard className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{kpi.customers}</div>
            )}
            <Users className="size-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Sales chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Performa Penjualan</CardTitle>
          <Select value={range} onValueChange={(v) => setParam("range", v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Rentang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 hari</SelectItem>
              <SelectItem value="30d">30 hari</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" />
                <YAxis>
                  <Label
                    value="Omzet (dalam ribuan)"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: "middle" }}
                  />
                </YAxis>
                <ReTooltip
                  formatter={(value: number) => formatIDR(value * 1000)}
                />
                <Line type="monotone" dataKey="v" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Pesanan Lunas (Paid)</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={String(perPage)}
              onValueChange={(v) => setParam("perPage", v)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Per Page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: perPage }).map((_, i) => (
                      <TableRow key={`s-${i}`}>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : rows.map((r) => (
                      <TableRow key={r.code}>
                        <TableCell className="font-medium">{r.code}</TableCell>
                        <TableCell>
                          {new Date(r.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>{r.customer}</TableCell>
                        <TableCell>
                          <Badge variant="default">{r.status}</Badge>
                        </TableCell>
                        <TableCell>{r.method ?? "-"}</TableCell>
                        <TableCell className="text-right">
                          {formatIDR(r.total)}
                        </TableCell>
                      </TableRow>
                    ))}
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
                  const p = i + 1; // Simplifikasi untuk UI, bisa dikembangkan
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
    </div>
  );
}
