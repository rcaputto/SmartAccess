import { getAppBaseUrl } from "./app-url";
import { headers } from "next/headers";

export async function serverFetchJson<T>(path: string, init?: RequestInit) {
  const baseUrl = await getAppBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  // Forward cookies so authenticated API routes work from Server Components.
  const h = await headers();
  const cookie = h.get("cookie");

  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let backendMessage = "";
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      backendMessage = data?.error || data?.message || JSON.stringify(data);
    } catch {
      try {
        backendMessage = await res.text();
      } catch {
        backendMessage = "";
      }
    }

    const suffix = backendMessage ? `: ${backendMessage}` : "";
    throw new Error(`Request failed (${res.status})${suffix}`);
  }

  return (await res.json()) as T;
}

