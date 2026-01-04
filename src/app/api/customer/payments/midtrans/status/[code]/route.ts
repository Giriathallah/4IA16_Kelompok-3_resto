import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await ctx.params; // ini adalah order_id midtrans yg kamu kirim
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key missing" },
        { status: 500 }
      );
    }

    const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProd
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";

    const res = await fetch(`${baseUrl}/${encodeURIComponent(code)}/status`, {
      headers: {
        Authorization:
          "Basic " + Buffer.from(serverKey + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[MIDTRANS_STATUS_ERROR]", err);
    return NextResponse.json(
      { error: "Gagal cek status pembayaran" },
      { status: 500 }
    );
  }
}
