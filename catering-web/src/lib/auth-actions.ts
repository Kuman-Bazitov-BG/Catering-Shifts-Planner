"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "./session";

// Shape returned to the forms via useActionState. `undefined` is the initial state.
export type AuthState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
      // Used to repopulate inputs after a failed submit.
      values?: {
        name?: string;
        email?: string;
      };
    }
  | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // 1. Validate
  const errors: NonNullable<AuthState>["errors"] = {};
  if (name.length < 2) errors.name = ["Name must be at least 2 characters."];
  if (!EMAIL_RE.test(email)) errors.email = ["Please enter a valid email."];
  if (password.length < 6)
    errors.password = ["Password must be at least 6 characters."];
  if (Object.keys(errors).length > 0) {
    return { errors, values: { name, email } };
  }

  // 2. Reject duplicate email
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return {
      message: "An account with this email already exists.",
      values: { name, email },
    };
  }

  // 3. Hash password and create the user
  const passwordHash = await hash(password, 10);
  const inserted = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id });

  const user = inserted[0];
  if (!user) {
    return {
      message: "Something went wrong while creating your account.",
      values: { name, email },
    };
  }

  // 4. Start session + redirect
  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  // 1. Validate presence
  const errors: NonNullable<AuthState>["errors"] = {};
  if (!email) errors.email = ["Email is required."];
  if (!password) errors.password = ["Password is required."];
  if (Object.keys(errors).length > 0) {
    return { errors, values: { email } };
  }

  // 2. Look up user and verify password (generic error to avoid user enumeration)
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];

  if (!user || !(await compare(password, user.passwordHash))) {
    return { message: "Invalid email or password.", values: { email } };
  }

  // 3. Start session + redirect
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
