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

  // Not logged in and trying to access a protected route → send to login,
  // remembering where the user was headed so we can return them there after.
  // This is an optimistic check (token only). Whether the user actually exists
  // is verified in the data layer / pages, so a stale-but-valid token can't
  // trap the user in a redirect loop with the auth pages.
  if (!isPublic && !session) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("redirect", path + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run on all routes except API routes, Next internals, and static assets.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
