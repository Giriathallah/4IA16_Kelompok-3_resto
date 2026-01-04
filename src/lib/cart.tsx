"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { CartLine, MenuItem, OrderType, PaymentChoice } from "./shop";

type State = {
  lines: CartLine[];
  orderType: OrderType;
  payment: PaymentChoice;
  ready: boolean;
};

type Actions = {
  add: (item: MenuItem) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  setOrderType: (t: OrderType) => void;
  setPayment: (p: PaymentChoice) => void;
  total: () => number;
  count: () => number;
  refetch: () => Promise<void>;
};

const CartContext = createContext<(State & Actions) | null>(null);

const GUEST_LS = "guest-cart:v1";
// TODO: ganti ke identitas nyata (context/auth) bila sudah siap
const USER_ID = "demo-user-id-123"; // hanya contoh

function isUnauthorized(err: unknown) {
  return (
    (err as any)?.message?.includes("401") ||
    (err as any)?.message?.includes("Unauthorized")
  );
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-user-id": USER_ID, // stub auth
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json().catch(() => ({}));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [payment, setPayment] = useState<PaymentChoice>("CASH");
  const [ready, setReady] = useState(false);
  const [guestMode, setGuestMode] = useState(false);

  const loadGuest = useCallback(() => {
    try {
      const raw = localStorage.getItem(GUEST_LS);
      const guest: CartLine[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(guest)) setLines(guest);
      else setLines([]);
    } catch {
      setLines([]);
    }
  }, []);

  const persistGuest = useCallback((next: CartLine[]) => {
    try {
      localStorage.setItem(GUEST_LS, JSON.stringify(next));
    } catch {}
  }, []);

  const refetch = useCallback(async () => {
    if (guestMode) {
      loadGuest();
      setReady(true);
      return;
    }
    try {
      const data = await api("/api/cart");
      const serverLines: CartLine[] = (data.items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        image: it.image ?? "",
        category: it.category,
        quantity: it.quantity,
      }));
      setLines(serverLines);
      setReady(true);
    } catch (e) {
      if (isUnauthorized(e)) {
        setGuestMode(true);
        loadGuest();
        setReady(true);
        return;
      }
      throw e;
    }
  }, [guestMode, loadGuest]);

  // First load: cek auth → jika authorized, merge guest→server sekali; jika 401, pakai guest
  useEffect(() => {
    (async () => {
      try {
        // Coba fetch untuk mendeteksi auth
        const data = await api("/api/cart");
        // Authorized: merge guest ke server (sekali)
        try {
          const raw = localStorage.getItem(GUEST_LS);
          const guest: CartLine[] = raw ? JSON.parse(raw) : [];
          if (Array.isArray(guest) && guest.length) {
            for (const g of guest) {
              await api("/api/cart", {
                method: "POST",
                body: JSON.stringify({ productId: g.id, qty: g.quantity }),
              });
            }
            localStorage.removeItem(GUEST_LS);
          }
        } catch {}
        // lalu ambil fresh dari server
        const serverLines: CartLine[] = (data.items || []).map((it: any) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          image: it.image ?? "",
          category: it.category,
          quantity: it.quantity,
        }));
        setLines(serverLines);
        setReady(true);
      } catch (e) {
        if (isUnauthorized(e)) {
          setGuestMode(true);
          loadGuest();
          setReady(true);
          return;
        }
        // error lain: tetap tampilkan kosong agar UI tidak crash
        setLines([]);
        setReady(true);
        console.error("[Cart init]", e);
      }
    })();
  }, [loadGuest]);

  // Persist saat guest mode dan lines berubah
  useEffect(() => {
    if (guestMode) persistGuest(lines);
  }, [guestMode, lines, persistGuest]);

  // Helpers
  const total = useCallback(
    () => lines.reduce((s, l) => s + l.price * l.quantity, 0),
    [lines]
  );
  const count = useCallback(
    () => lines.reduce((c, l) => c + l.quantity, 0),
    [lines]
  );

  // Actions
  const add = useCallback<Actions["add"]>(
    async (item) => {
      // Guest: hanya localStorage
      if (guestMode) {
        setLines((prev) => {
          const exist = prev.find((l) => l.id === item.id);
          if (exist)
            return prev.map((l) =>
              l.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
            );
          return [...prev, { ...item, quantity: 1 }];
        });
        return;
      }

      // Authorized: optimistic + server
      setLines((prev) => {
        const exist = prev.find((l) => l.id === item.id);
        if (exist)
          return prev.map((l) =>
            l.id === item.id ? { ...l, quantity: l.quantity + 1 } : l
          );
        return [...prev, { ...item, quantity: 1 }];
      });

      try {
        await api("/api/cart", {
          method: "POST",
          body: JSON.stringify({ productId: item.id, qty: 1 }),
        });
      } catch (e: any) {
        if (isUnauthorized(e)) {
          // Beralih ke guest mode tanpa hard redirect
          setGuestMode(true);
          loadGuest();
          await refetch(); // akan otomatis pakai guest
          return;
        }
        await refetch(); // rollback via fetch fresh
        throw e;
      }
    },
    [guestMode, loadGuest, refetch]
  );

  const setQty = useCallback<Actions["setQty"]>(
    async (id, qty) => {
      if (guestMode) {
        setLines((prev) => {
          if (qty <= 0) return prev.filter((l) => l.id !== id);
          return prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l));
        });
        return;
      }

      const snapshot = lines;
      setLines((prev) => {
        if (qty <= 0) return prev.filter((l) => l.id !== id);
        return prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l));
      });
      try {
        await api("/api/cart/item", {
          method: "PATCH",
          body: JSON.stringify({ productId: id, qty }),
        });
      } catch (e) {
        if (isUnauthorized(e)) {
          setGuestMode(true);
          setLines(snapshot);
          loadGuest();
          return;
        }
        setLines(snapshot);
        throw e;
      }
    },
    [guestMode, lines, loadGuest]
  );

  const remove = useCallback<Actions["remove"]>(
    async (id) => {
      if (guestMode) {
        setLines((prev) => prev.filter((l) => l.id !== id));
        return;
      }

      const snapshot = lines;
      setLines((prev) => prev.filter((l) => l.id !== id));
      try {
        await api(`/api/cart/item?productId=${id}`, { method: "DELETE" });
      } catch (e) {
        if (isUnauthorized(e)) {
          setGuestMode(true);
          setLines(snapshot);
          loadGuest();
          return;
        }
        setLines(snapshot);
        throw e;
      }
    },
    [guestMode, lines, loadGuest]
  );

  const clear = useCallback<Actions["clear"]>(async () => {
    if (guestMode) {
      setLines([]);
      return;
    }

    const snapshot = lines;
    setLines([]);
    try {
      await api("/api/cart", { method: "DELETE" });
    } catch (e) {
      if (isUnauthorized(e)) {
        setGuestMode(true);
        setLines(snapshot);
        loadGuest();
        return;
      }
      setLines(snapshot);
      throw e;
    }
  }, [guestMode, lines, loadGuest]);

  const value = useMemo(
    () => ({
      lines,
      orderType,
      payment,
      ready,
      add,
      setQty,
      remove,
      clear,
      setOrderType,
      setPayment,
      total,
      count,
      refetch,
    }),
    [
      lines,
      orderType,
      payment,
      ready,
      add,
      setQty,
      remove,
      clear,
      setOrderType,
      setPayment,
      total,
      count,
      refetch,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
