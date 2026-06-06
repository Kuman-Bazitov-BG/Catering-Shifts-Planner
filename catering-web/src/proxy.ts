import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/jwt";

// In Next.js 16, Middleware was renamed to Proxy. This runs an optimistic auth
// check on every matched route (cookie only, no DB) and gates access.
const publicRoutes = ["/", "/login", "/register"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = publicRoutes.includes(path);

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);

  // Not logged in and trying to access a protected route → send to login.
  if (!isPublic && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Already logged in but visiting an auth page → send to dashboard.
  if (session && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Run on all routes except API routes, Next internals, and static assets.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
