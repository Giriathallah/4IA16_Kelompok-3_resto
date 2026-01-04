import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Sign Cloudinary upload tanpa folder.
 * Client:
 * 1) GET /api/upload/sign → { timestamp, signature, apiKey, cloudName }
 * 2) POST file ke https://api.cloudinary.com/v1_1/{cloudName}/image/upload
 */
export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary env vars are missing" },
      { status: 500 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Params yang disign (alphabetical, tanpa api_key/signature)
  // Di sini cuma timestamp.
  const toSign = `timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({
    timestamp,
    signature,
    apiKey,
    cloudName,
  });
}
