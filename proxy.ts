import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Better-auth session cookie names ─────────────────────────────────────
const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token", // HTTPS / production variant
];

// ── Routes that are always public ────────────────────────────────────────
const PUBLIC_PREFIXES = [
  "/auth", // /auth/login, /auth/signup, /auth/onboarding, /auth/verify-2fa,
  // /auth/forgot-password, /auth/reset-password
  "/api/auth", // Better Auth proxy handler
  "/api", // All other API routes
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSession(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => {
    const cookie = request.cookies.get(name);
    return !!cookie?.value && cookie.value.length > 10;
  });
}

// ── Proxy function ────────────────────────────────────────────────────────
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Always allow public routes through
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // ── CRITICAL FIX: allow OTT (one-time-token) requests through ──────────

  if (searchParams.has("ott")) {
    return NextResponse.next();
  }

  // No session cookie → redirect to login, preserving the intended URL
  if (!hasSession(request)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/user/:path*", "/driver/:path*", "/admin/:path*"],
};
