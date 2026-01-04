"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Category = "MAIN" | "APPETIZER" | "DRINK";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<Product>;
  onSubmit: (
    payload: Omit<Product, "id" | "createdAt"> & { id?: string }
  ) => Promise<void>;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: Props) {
  const isEdit = !!initial?.id;

  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? "MAIN"
  );
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "0");
  const [active, setActive] = useState(initial?.isActive ?? true);

  // image
  const [imageUrl, setImageUrl] = useState<string>(initial?.imageUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setPrice((initial?.price ?? "").toString());
    setCategory(initial?.category ?? "MAIN");
    setStock((initial?.stock ?? 0).toString());
    setActive(initial?.isActive ?? true);
    setImageUrl(initial?.imageUrl ?? "");
    setFile(null);
    setFilePreview(null);
    setImgOk(true);
  }, [open, initial]);

  // Buat preview untuk file baru
  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Maksimal 5MB");
        return;
      }
      setFile(f);
    },
    []
  );

  // Upload langsung ke Cloudinary (signed)
  const uploadToCloudinary = useCallback(async (): Promise<string> => {
    if (!file) return imageUrl || "";

    setUploading(true);
    try {
      // 1) minta signature & info
      const sigRes = await fetch("/api/upload/sign", { cache: "no-store" });
      if (!sigRes.ok) throw new Error("Gagal ambil signature");
      const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

      // 2) POST ke Cloudinary
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: form,
        }
      );
      if (!upRes.ok) throw new Error("Upload ke Cloudinary gagal");
      const up = await upRes.json();
      if (!up.secure_url) throw new Error("Upload tidak mengembalikan url");

      return up.secure_url as string;
    } finally {
      setUploading(false);
    }
  }, [file, imageUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Jika user pilih file baru → upload dulu.
      const finalImageUrl = file
        ? await uploadToCloudinary()
        : imageUrl || undefined;

      await onSubmit({
        id: initial?.id,
        name: name.trim(),
        price: Number(price) || 0,
        category,
        stock: Number(stock) || 0,
        isActive: active,
        imageUrl: finalImageUrl,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Category)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPETIZER">APPETIZER</SelectItem>
                  <SelectItem value="MAIN">MAIN</SelectItem>
                  <SelectItem value="DRINK">DRINK</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image upload + preview */}
          <div className="grid gap-2">
            <Label htmlFor="image">Gambar Produk</Label>

            {/* Input file */}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handlePickFile}
            />

            {/* Preview: jika pilih file baru → pakai preview lokal; jika edit & tidak pilih file → tampilkan imageUrl lama */}
            {(filePreview || imageUrl) && (
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border",
                  imgOk ? "bg-muted/40" : "bg-destructive/10"
                )}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={filePreview || imageUrl!}
                    alt={name || "Product image"}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover"
                    onLoadingComplete={() => setImgOk(true)}
                    onError={() => setImgOk(false)}
                    priority={false}
                  />
                </div>
                {!imgOk && (
                  <div className="p-2 text-xs text-destructive">
                    Gagal memuat gambar.
                  </div>
                )}
              </div>
            )}

            {/* Info kecil */}
            <p className="text-xs text-muted-foreground">
              Format: JPG/PNG, maks 5MB. File akan diupload ke Cloudinary saat
              menyimpan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ""))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="active">Aktif</Label>
              <div className="flex h-10 items-center rounded-md border px-3">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <span
                  className={cn(
                    "ml-3 text-sm",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {uploading
                ? "Mengunggah…"
                : isEdit
                ? "Simpan Perubahan"
                : "Tambah"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
