import "server-only";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";

export type AuthedUser = { id: number; name: string; email: string };

// Verifies email + password against the stored bcrypt hash. Returns a safe user
// (no password hash) on success, or null on any failure. Shared by the web login
// Server Action and the REST login route.
export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthedUser | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  const ok = await compare(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, name: user.name, email: user.email };
}
