// app/(user)/cart/checkout/success/page.tsx
"use client";

import { Suspense } from "react";
import CheckoutSuccessContent from "./successPage";

export const dynamic = "force-dynamic"; // hindari prerender error berbasis query
// atau bisa: export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={<div className="max-w-xl mx-auto px-4 py-8">Memuat…</div>}
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
