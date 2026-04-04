import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname === "/login") return NextResponse.next();
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const token = await getToken({ req });
  const isAuthed = Boolean(token);

  if (isAuthed) return NextResponse.next();

  // For API routes, return JSON 401 (avoid HTML redirects that break res.json()).
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/bookings/:path*",
    "/operations/:path*",
    "/finance/:path*",
    "/api/:path*",
  ],
};

