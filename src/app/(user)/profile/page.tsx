"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import Link from "next/link";
import { ArrowLeft, User, History, LogOut } from "lucide-react";
import { logOut } from "@/actions/auth"; // server action

type Profile = {
  id: string;
  username: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: "admin" | "user";
};

type OrderHistoryItem = {
  id: string;
  date: string; // ISO
  total: number;
  status: "OPEN" | "AWAITING_PAYMENT" | "PAID" | "CANCELLED";
  items: string[]; // e.g. ["Nasi Goreng x2", "Es Teh"]
};

function formatIDR(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch profile + history
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes, hRes] = await Promise.all([
          fetch("/api/auth/user", { cache: "no-store" }),
          fetch("/api/customer/orders/history", { cache: "no-store" }),
        ]);

        if (abort) return;

        if (pRes.status === 401) {
          setError("Anda belum login.");
          setLoading(false);
          return;
        }
        if (!pRes.ok) throw new Error("Gagal memuat profil");

        const pData: Profile = await pRes.json();
        setProfile(pData);
        setForm({ name: pData.name ?? "", email: pData.email });

        if (hRes.ok) {
          const { items } = (await hRes.json()) as {
            items: OrderHistoryItem[];
          };
          setOrders(items || []);
        } else if (hRes.status !== 401) {
          console.warn("Gagal memuat riwayat pesanan");
        }
      } catch (e: any) {
        setError(e?.message ?? "Terjadi kesalahan");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const onSave = useCallback(() => {
    if (!profile) return;
    setProfile((p) => (p ? { ...p, name: form.name, email: form.email } : p));
    setEdit(false);
  }, [form, profile]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-lg hover:bg-accent"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold">Profil</h1>

        <form action={logOut} className="ml-auto">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-accent"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </form>
      </div>

      <div className="bg-card rounded-2xl p-6 border">
        {loading ? (
          <div className="space-y-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-full bg-muted rounded" />
            <div className="h-10 w-1/2 bg-muted rounded" />
          </div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : !profile ? (
          <div className="text-muted-foreground">
            Data profil tidak ditemukan.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary-foreground" />
                )}
              </div>

              <button
                onClick={() => (edit ? onSave() : setEdit(true))}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
              >
                {edit ? "Simpan" : "Ubah"}
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Nama
                </label>
                {edit ? (
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, name: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border bg-background"
                  />
                ) : (
                  <p className="font-medium">{profile.name ?? "-"}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Email
                </label>
                {edit ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border bg-background"
                  />
                ) : (
                  <p className="font-medium">{profile.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Peran
                </label>
                <p className="font-medium capitalize">{profile.role}</p>
              </div>

              {/* Order History */}
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4" />
                  <span className="font-medium">Riwayat Pesanan</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Belum ada pesanan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="bg-background rounded-xl p-4 border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{o.id}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(o.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-primary">
                              {formatIDR(o.total)}
                            </div>
                            <div
                              className="text-sm"
                              style={{
                                color:
                                  o.status === "PAID"
                                    ? "var(--green-600)"
                                    : o.status === "CANCELLED"
                                    ? "var(--red-600)"
                                    : "var(--muted-foreground)",
                              }}
                            >
                              {o.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Items: {o.items.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
