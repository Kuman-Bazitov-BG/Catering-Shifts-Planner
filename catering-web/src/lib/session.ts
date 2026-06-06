import "server-only";
import { cookies } from "next/headers";
import { encrypt, SESSION_COOKIE } from "./jwt";

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Issues a signed JWT and stores it in an HTTP-only cookie.
export async function createSession(userId: number): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  const token = await encrypt(userId);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Secure cookies are dropped over plain http, so only enable in production.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
