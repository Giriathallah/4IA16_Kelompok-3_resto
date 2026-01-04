import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Ganti dengan URL produksi Anda
  metadataBase: new URL(
    "https://resto-bunda-l56myel49-giri-athallahs-projects.vercel.app/"
  ),
  title: {
    template: "%s | Resto Bunda",
    default: "Resto Bunda - Aplikasi Kasir & POS Restoran Modern",
  },
  description:
    "Kelola pesanan, pembayaran, dan laporan restoran Anda dengan mudah menggunakan Resto Bunda. Aplikasi POS modern yang dirancang untuk efisiensi bisnis kuliner.",
  keywords: [
    "POS",
    "Point of Sale",
    "Aplikasi Kasir",
    "Restoran",
    "Resto Bunda",
    "Manajemen Restoran",
    "Sistem Kasir",
  ],
  authors: [{ name: "Giri Athallah", url: "https://giriathallah.vercel.app" }],
  creator: "Giri Athallah",
  publisher: "Giri Athallah",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
