"use server";

import { redirect } from "next/navigation";
import { authenticateUser, registerUser } from "@/services/users";
import { safeRedirectTarget } from "./redirect";
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

  // 2. Create the account
  const res = await registerUser(name, email, password);
  if ("error" in res) {
    return { message: res.error, values: { name, email } };
  }

  // 3. Start session + redirect
  await createSession(res.user.id);
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
  const redirectTo = safeRedirectTarget(String(formData.get("redirect") ?? ""));

  // 1. Validate presence
  const errors: NonNullable<AuthState>["errors"] = {};
  if (!email) errors.email = ["Email is required."];
  if (!password) errors.password = ["Password is required."];
  if (Object.keys(errors).length > 0) {
    return { errors, values: { email } };
  }

  // 2. Verify credentials (generic error to avoid user enumeration)
  const user = await authenticateUser(email, password);
  if (!user) {
    return { message: "Invalid email or password.", values: { email } };
  }

  // 3. Start session + redirect (back to where the user came from, if known)
  await createSession(user.id);
  redirect(redirectTo ?? "/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/");
}
