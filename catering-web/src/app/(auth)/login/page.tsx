import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { safeRedirectTarget } from "@/lib/redirect";
import LoginForm from "./LoginForm";
import { LogIn } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const redirectParam = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
  const redirectTo = safeRedirectTarget(redirectParam);

  // Already logged in (real, existing user) → skip the auth page.
  const user = await getCurrentUser();
  if (user) redirect(redirectTo ?? "/dashboard");

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
            <LogIn className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Log in to manage your catering shifts.
          </p>
        </div>

        <LoginForm redirectTo={redirectTo} />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-amber-700 hover:underline dark:text-amber-500"
          >
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
