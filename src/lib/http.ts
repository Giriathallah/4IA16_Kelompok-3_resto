/**
 * @fileoverview HTTP Helper Utilities untuk API Routes
 * @module lib/http
 * @description Kumpulan fungsi helper untuk membuat response JSON,
 *              error handling, dan parsing pagination
 */

import { NextResponse } from "next/server";

/**
 * Membuat JSON response dengan header content-type yang benar
 *
 * @template T - Tipe data response
 * @param {T} data - Data yang akan dijadikan JSON response
 * @param {number|ResponseInit} [init] - Status code atau ResponseInit object
 * @returns {NextResponse} Response object dengan JSON body
 *
 * @example
 * // Dengan status code default (200)
 * return json({ items: [...], total: 10 });
 *
 * @example
 * // Dengan status code custom
 * return json({ id: "uuid" }, 201);
 */
export function json<T>(data: T, init?: number | ResponseInit) {
  const status =
    typeof init === "number"
      ? init
      : (init as ResponseInit | undefined)?.status ?? 200;
  const headers = new Headers((init as ResponseInit | undefined)?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new NextResponse(JSON.stringify(data), { status, headers });
}

/**
 * Membuat error response dalam format JSON
 *
 * @param {string} message - Pesan error yang akan ditampilkan
 * @param {number} [status=400] - HTTP status code (default: 400 Bad Request)
 * @param {Record<string, unknown>} [extra] - Data tambahan untuk response (e.g., validation issues)
 * @returns {NextResponse} Error response dengan format { error: message, ...extra }
 *
 * @example
 * // Error sederhana
 * return error("Invalid request", 400);
 *
 * @example
 * // Error dengan detail validasi
 * return error("Validation failed", 422, { issues: zodError.flatten() });
 */
export function error(
  message: string,
  status = 400,
  extra?: Record<string, unknown>
) {
  return json({ error: message, ...extra }, status);
}

/**
 * Parse parameter pagination dari URL search params
 *
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object} Object dengan properti pagination:
 *   - page: Nomor halaman (min: 1)
 *   - perPage: Jumlah item per halaman (min: 1, max: 100)
 *   - skip: Offset untuk query database
 *   - take: Limit untuk query database
 *
 * @example
 * // URL: /api/products?page=2&perPage=20
 * const { page, perPage, skip, take } = parsePagination(searchParams);
 * // Returns: { page: 2, perPage: 20, skip: 20, take: 20 }
 */
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

