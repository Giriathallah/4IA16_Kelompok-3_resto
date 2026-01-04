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
import { Search, RefreshCcw, CreditCard } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

type PaymentMethod = "CASH" | "QRIS" | "CARD" | "BANK_TRANSFER";

type Row = {
  id: string;
  orderCode: string;
  method: PaymentMethod;
  amount: number;
  refCode?: string;
  paidAt: string;
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

const METHODS: PaymentMethod[] = ["CASH", "QRIS", "CARD", "BANK_TRANSFER"];

const MOCK_PAYMENTS: Row[] = Array.from({ length: 60 }).map((_, i) => ({
  id: crypto.randomUUID(),
  orderCode: `ORD-2025-09-${String(15 + (i % 10)).padStart(2, "0")}-${
    1000 + (i % 40)
  }`,
  method: METHODS[i % METHODS.length],
  amount: [59000, 125000, 87000, 235000][i % 4],
  refCode: i % 3 ? `REF-${80000 + i}` : undefined,
  paidAt: new Date(Date.now() - i * 36e5).toISOString(),
}));

const SERIES = Array.from({ length: 7 }).map((_, i) => ({
  d: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
  v:
    MOCK_PAYMENTS.slice(i * 4, i * 4 + 4).reduce((s, r) => s + r.amount, 0) /
    1000,
}));

async function fetchPaymentsStub(): Promise<Row[]> {
  return new Promise((res) => setTimeout(() => res(MOCK_PAYMENTS), 300));
}

function MethodBadge({ m }: { m: PaymentMethod }) {
  return (
    <Badge className="bg-primary/10 text-primary border border-primary/20">
      {m}
    </Badge>
  );
}

export default function PaymentsPage() {
  const router = useRouter();
  const search = useSearchParams();

  const q = search.get("q") ?? "";
  const method = (search.get("method") ?? "all") as "all" | PaymentMethod;
  const range = (search.get("range") ?? "7d") as "today" | "7d" | "30d" | "all";
  const sort = (search.get("sort") ?? "newest") as
    | "newest"
    | "oldest"
    | "amount_desc"
    | "amount_asc";
  const page = Number(search.get("page") ?? "1");
  const perPage = Number(search.get("perPage") ?? "12");

  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [total, setTotal] = React.useState(0);

  function setParam(key: string, val: string) {
    const p = new URLSearchParams(search.toString());
    p.set(key, val);
    if (!["page", "perPage"].includes(key)) p.set("page", "1");
    router.replace(`/payments?${p.toString()}`);
  }

  React.useEffect(() => {
    setLoading(true);
    fetchPaymentsStub()
      .then((data) => {
        const qLower = q.toLowerCase();
        let filtered = data.filter(
          (r) =>
            r.orderCode.toLowerCase().includes(qLower) ||
            (r.refCode ?? "").toLowerCase().includes(qLower)
        );
        if (method !== "all")
          filtered = filtered.filter((r) => r.method === method);

        const now = Date.now();
        const within = (iso: string) => {
          const t = +new Date(iso);
          if (range === "today") {
            const d0 = new Date();
            d0.setHours(0, 0, 0, 0);
            const d1 = new Date();
            d1.setHours(23, 59, 59, 999);
            return t >= +d0 && t <= +d1;
          }
          if (range === "7d") return t >= now - 7 * 864e5;
          if (range === "30d") return t >= now - 30 * 864e5;
          return true;
        };
        if (range !== "all")
          filtered = filtered.filter((r) => within(r.paidAt));

        filtered.sort((a, b) => {
          if (sort === "newest")
            return +new Date(b.paidAt) - +new Date(a.paidAt);
          if (sort === "oldest")
            return +new Date(a.paidAt) - +new Date(b.paidAt);
          if (sort === "amount_desc") return b.amount - a.amount;
          return a.amount - b.amount;
        });

        setTotal(filtered.length);
        const start = (page - 1) * perPage;
        setRows(filtered.slice(start, start + perPage));
      })
      .finally(() => setLoading(false));
  }, [q, method, range, sort, page, perPage]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="size-5" /> Pembayaran
          </CardTitle>
          <Button
            variant="secondary"
            onClick={() => router.replace("/payments")}
          >
            <RefreshCcw className="mr-2 size-4" /> Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SERIES}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="d" />
                <YAxis />
                <ReTooltip />
                <Line type="monotone" dataKey="v" dot />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Cari kode pesanan / ref pembayaran…"
                defaultValue={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>

            <Select value={method} onValueChange={(v) => setParam("method", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                <SelectItem value="CASH">CASH</SelectItem>
                <SelectItem value="QRIS">QRIS</SelectItem>
                <SelectItem value="CARD">CARD</SelectItem>
                <SelectItem value="BANK_TRANSFER">BANK_TRANSFER</SelectItem>
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

            <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="amount_desc">Nominal tertinggi</SelectItem>
                <SelectItem value="amount_asc">Nominal terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Pesanan</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Ref</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
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
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.orderCode}
                      </TableCell>
                      <TableCell>
                        <MethodBadge m={r.method} />
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate max-w-[160px] inline-block align-middle">
                                {r.refCode ?? "—"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {r.refCode ?? "Tidak ada ref"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {new Date(r.paidAt).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatIDR(r.amount)}
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
    </div>
  );
}
