// app/(user)/cart/checkout/success/success-content.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type OrderItem = {
  productName: string;
  qty: number;
  price: number;
  total: number;
};
type OrderDetail = {
  code: string;
  status: "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
  total: number;
  items: OrderItem[];
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CheckoutSuccessContent() {
  const params = useSearchParams();
  const code = params.get("code") || "";
  const mid = params.get("mid") || "";
  const isCashless = Boolean(mid);

  const [data, setData] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  async function fetchOrder() {
    if (!code) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/customer/orders/${encodeURIComponent(code)}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Gagal memuat");
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function manualCheckStatus() {
    if (!code || checking) return;
    setChecking(true);
    try {
      if (!isCashless) {
        await fetchOrder();
        alert(
          "Ini pesanan dengan pembayaran tunai. Minta kasir menyelesaikan pembayaran, lalu klik refresh."
        );
        return;
      }
      const orderIdForMidtrans = mid;
      const r = await fetch(
        `/api/customer/payments/midtrans/status/${encodeURIComponent(
          orderIdForMidtrans
        )}`
      );
      const s = await r.json();
      const isPaid =
        s?.transaction_status === "settlement" ||
        (s?.transaction_status === "capture" && s?.fraud_status === "accept");
      if (!isPaid) {
        alert(`Status pembayaran: ${s?.transaction_status || "unknown"}`);
        return;
      }
      let confirmRes = await fetch(
        `/api/customer/orders/${encodeURIComponent(
          code
        )}/confirm-cashless?mid=${encodeURIComponent(mid)}`,
        { method: "POST" }
      );
      if (confirmRes.status === 404) {
        confirmRes = await fetch(
          `/api/customer/orders/${encodeURIComponent(code)}`,
          { method: "POST" }
        );
      }
      const cj = await confirmRes.json().catch(() => ({}));
      if (!confirmRes.ok || cj?.paid === false) {
        alert(cj?.error || "Gagal mengonfirmasi pembayaran.");
        return;
      }
      await fetchOrder();
      alert("Pembayaran terkonfirmasi. Status order sudah PAID.");
    } catch {
      alert("Gagal mengecek/konfirmasi pembayaran.");
    } finally {
      setChecking(false);
    }
  }

  if (!code)
    return (
      <div className="max-w-xl mx-auto px-4 py-8">Order tidak ditemukan.</div>
    );
  if (loading) return <div className="max-w-xl mx-auto px-4 py-8">Memuat…</div>;
  if (!data)
    return (
      <div className="max-w-xl mx-auto px-4 py-8">Gagal memuat order.</div>
    );

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-card border rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Order Berhasil Dibuat</h1>
        <p className="text-muted-foreground">
          Tunjukkan <span className="font-semibold">Order ID</span> ini ke kasir
          untuk pembayaran.
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Order ID</span>
            <span className="font-mono">{data.code}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Status</span>
            <span
              className={
                data.status === "PAID"
                  ? "text-green-600 font-semibold"
                  : data.status === "AWAITING_PAYMENT"
                  ? "text-amber-600 font-semibold"
                  : "font-semibold"
              }
            >
              {data.status}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 space-y-3">
          {data.items.map((it, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {it.productName} x{it.qty}
              </span>
              <span className="font-medium">{formatIDR(it.total)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
            <span>Total</span>
            <span className="text-primary">{formatIDR(data.total)}</span>
          </div>
        </div>

        {data.status !== "PAID" && (
          <div className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              {isCashless
                ? "Setelah pembayaran cashless selesai, klik tombol di bawah untuk memperbarui status."
                : "Setelah kasir menyelesaikan pembayaran tunai, klik tombol di bawah untuk memuat ulang status."}
            </p>
            <button
              onClick={manualCheckStatus}
              disabled={checking}
              className="self-start bg-primary text-primary-foreground px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {checking
                ? "Memeriksa…"
                : isCashless
                ? "Cek Status Pembayaran"
                : "Muat Ulang Status"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
