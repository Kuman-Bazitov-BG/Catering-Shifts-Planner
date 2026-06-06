import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { decrypt, SESSION_COOKIE } from "./jwt";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
};

// Returns the logged-in user (safe subset of columns), or null if not logged in.
// Cached per request so calling it in the layout and a page hits the DB once.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await decrypt(token);
  if (!session) return null;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      photoUrl: users.photoUrl,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return rows[0] ?? null;
});

// Use in protected pages/actions: returns the user or redirects to /login.
export const verifySession = cache(async (): Promise<CurrentUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
});
