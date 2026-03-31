import { headers } from "next/headers";

/**
 * Resolve a safe base URL for server-side fetches.
 *
 * Priority:
 * - APP_URL (explicit env override for deploy/preview)
 * - x-forwarded-host / host + x-forwarded-proto (when behind proxy)
 * - localhost fallback (dev)
 */
export async function getAppBaseUrl() {
  const explicit = process.env.APP_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

