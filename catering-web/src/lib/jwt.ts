import { SignJWT, jwtVerify } from "jose";

// Pure JWT sign/verify helpers (no next/headers, no `server-only`) so this module
// is safe to import from proxy.ts, Server Actions, and the data access layer alike.
export const SESSION_COOKIE = "session";

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: number;
};

export async function encrypt(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "number") return null;
    return { userId: payload.userId };
  } catch {
    // Invalid or expired token.
    return null;
  }
}
