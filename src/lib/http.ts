import { NextResponse } from "next/server";

export function json<T>(data: T, init?: number | ResponseInit) {
  const status =
    typeof init === "number"
      ? init
      : (init as ResponseInit | undefined)?.status ?? 200;
  const headers = new Headers((init as ResponseInit | undefined)?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { status, headers });
}

export function error(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return json({ error: message, ...extra }, status);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const perPage = Math.min(
    100,
    Math.max(1, Number(searchParams.get("perPage") ?? "10"))
  );
  const skip = (page - 1) * perPage;
  const take = perPage;
  return { page, perPage, skip, take };
}
