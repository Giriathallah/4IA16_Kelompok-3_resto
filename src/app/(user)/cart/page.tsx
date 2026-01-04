"use client";

import * as React from "react";
import {
  ArrowLeft,
  MapPin,
  ShoppingCart,
  Wallet,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { QuantityControl } from "@/components/user/qualityControl";
import { CartSummary } from "@/components/user/cartSummary";
import { PaymentChoice, OrderType } from "@/lib/shop";
import { toast } from "sonner"; // ⬅️ add

function format(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function ensureSnapJs(clientKey: string, isProd: boolean) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if ((window as any).snap) return resolve();

    const script = document.createElement("script");
    script.src = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Snap"));
    document.body.appendChild(script);
  });
}

export default function CartPage() {
  const {
    lines,
    setQty,
    remove,
    total,
    orderType,
    setOrderType,
    payment,
    setPayment,
    clear,
  } = useCart();

  const handleCheckout = async () => {
    if (lines.length === 0) return;

    if (payment === "CASH") {
      const res = await fetch("/api/customer/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ diningType: orderType, paymentChoice: "CASH" }),
      });

      if (res.status === 401) {
        toast.error("Silakan masuk terlebih dahulu.");
        window.location.href = "/sign-in";
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Checkout gagal");
        return;
      }

      toast.success("Order berhasil dibuat");
      window.location.href = `/cart/checkout/success?code=${encodeURIComponent(
        data.code
      )}`;
      return;
    }

    if (payment === "CASHLESS") {
      const res = await fetch("/api/customer/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          diningType: orderType,
          paymentChoice: "CASHLESS",
        }),
      });

      if (res.status === 401) {
        toast.error("Silakan masuk terlebih dahulu.");
        window.location.href = "/sign-in";
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Checkout gagal");
        return;
      }

      const snapToken: string | undefined = data?.payment?.snapToken;
      if (!snapToken) {
        toast.error("Snap token tidak ditemukan dari server.");
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as
        | string
        | undefined;
      const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

      if (!clientKey) {
        toast.error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diset.");
        return;
      }

      try {
        // gunakan nilai dari server jika disediakan, fallback ke env
        await ensureSnapJs(data.clientKey ?? clientKey, data.isProd ?? isProd);
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            toast.success("Pembayaran berhasil.");
            window.location.href = `/cart/checkout/success?code=${encodeURIComponent(
              data.code
            )}&mid=${encodeURIComponent(data.mid)}`;
          },
          onPending: () => {
            toast.success("Pembayaran diproses. Mengecek status…");
            window.location.href = `/cart/checkout/success?code=${encodeURIComponent(
              data.code
            )}&mid=${encodeURIComponent(data.mid)}`;
          },
          onError: () => {
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            // user menutup popup; order tetap AWAITING_PAYMENT
            toast.error("Popup pembayaran ditutup.");
          },
        });
      } catch (e: any) {
        toast.error(e?.message || "Gagal membuka Snap.");
      }
      return;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>
      {lines.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Your cart is empty</p>
          <Link
            href="/"
            className="mt-4 inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Items */}
          <div className="bg-card rounded-2xl p-6 border">
            {lines.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-4 py-4 border-b last:border-b-0"
              >
                <img
                  src={l.image}
                  alt={l.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{l.name}</h3>
                  <p className="text-primary font-medium">{format(l.price)}</p>
                </div>
                <QuantityControl
                  value={l.quantity}
                  onChange={(n) => setQty(l.id, n)}
                />
                <button
                  onClick={() => {
                    remove(l.id);
                    toast.success("Item dihapus dari keranjang");
                  }}
                  className="px-3 py-2 rounded-lg hover:bg-accent"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Order Type */}
          <div className="bg-card rounded-2xl p-6 border">
            <h3 className="font-semibold mb-4">Order Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrderType("DINE_IN")}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  orderType === "DINE_IN"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <MapPin className="w-6 h-6 mx-auto mb-2" />
                <span className="block font-medium">Dine In</span>
              </button>
              <button
                onClick={() => setOrderType("TAKE_AWAY")}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  orderType === "TAKE_AWAY"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                <span className="block font-medium">Take Away</span>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card rounded-2xl p-6 border">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPayment("CASH")}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  payment === "CASH"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <Wallet className="w-6 h-6 mx-auto mb-2" />
                <span className="block font-medium">Cash (bayar di kasir)</span>
              </button>
              <button
                onClick={() => setPayment("CASHLESS")}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  payment === "CASHLESS"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <CreditCard className="w-6 h-6 mx-auto mb-2" />
                <span className="block font-medium">Cashless (Midtrans)</span>
              </button>
            </div>

            {payment === "CASHLESS" && (
              <div className="mt-3 text-sm text-muted-foreground">
                Metode cashless akan membuka <strong>Midtrans Snap</strong> saat
                “Place Order”.
              </div>
            )}
          </div>

          {/* Summary */}
          <CartSummary total={total()} onCheckout={handleCheckout} />
        </div>
      )}
    </div>
  );
}
