"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type StockType = "IN" | "OUT" | "ADJUSTMENT";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productName: string;
  currentStock: number;
  onSubmit: (payload: {
    type: StockType;
    qty: number;
    note?: string;
  }) => Promise<void>;
};

export function StockDrawer({
  open,
  onOpenChange,
  productName,
  currentStock,
  onSubmit,
}: Props) {
  const [type, setType] = React.useState<StockType>("IN");
  const [qty, setQty] = React.useState<string>("0");
  const [note, setNote] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setType("IN");
      setQty("0");
      setNote("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        type,
        qty: Number(qty) || 0,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-lg p-4 sm:p-6"
        >
          <DrawerHeader className="px-0">
            <DrawerTitle>Sesuaikan Stok • {productName}</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              Stok saat ini: <strong>{currentStock}</strong>
            </p>
          </DrawerHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Jenis Penyesuaian</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as StockType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">IN (Tambah)</SelectItem>
                  <SelectItem value="OUT">OUT (Kurangi)</SelectItem>
                  <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qty">Kuantitas</Label>
              <Input
                id="qty"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Catatan (opsional)</Label>
              <Textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: koreksi stok setelah stock-take"
              />
            </div>
          </div>

          <DrawerFooter className="px-0">
            <Button type="submit" disabled={loading}>
              Simpan
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
