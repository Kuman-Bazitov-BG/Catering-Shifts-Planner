import "server-only";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
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

export type RegisterResult =
  | { ok: true; user: AuthedUser }
  | { error: string; status: number };

// Creates a new user account with a bcrypt-hashed password. Shared by the web
// register Server Action and the REST register route.
export async function registerUser(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return { error: "An account with this email already exists.", status: 409 };
  }

  const passwordHash = await hash(password, 10);
  const inserted = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email });

  const user = inserted[0];
  if (!user) {
    return { error: "Something went wrong while creating your account.", status: 500 };
  }

  return { ok: true, user };
}
