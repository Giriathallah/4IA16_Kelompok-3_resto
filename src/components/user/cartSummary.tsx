"use client";

export function CartSummary({
  total,
  onCheckout,
}: {
  total: number;
  onCheckout: () => void;
}) {
  const format = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  return (
    <div className="bg-card rounded-2xl p-6 border">
      <div className="flex items-center justify-between text-xl font-bold">
        <span>Total:</span>
        <span className="text-primary">{format(total)}</span>
      </div>
      <button
        onClick={onCheckout}
        className="w-full mt-4 bg-primary text-primary-foreground py-3 rounded-xl font-semibold"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
