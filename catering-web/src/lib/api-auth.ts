import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { decrypt } from "./jwt";

export type ApiUser = { id: number; name: string; email: string };

// Resolves the user from an `Authorization: Bearer <jwt>` header (mobile clients
// send the token returned by POST /api/auth/login). Returns null if missing,
// malformed, expired, or the user no longer exists.
export async function getUserFromBearer(req: Request): Promise<ApiUser | null> {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length).trim();
  const session = await decrypt(token);
  if (!session) return null;

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
}
