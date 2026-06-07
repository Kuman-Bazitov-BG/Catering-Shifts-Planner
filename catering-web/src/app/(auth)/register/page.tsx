import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import RegisterForm from "./RegisterForm";
import { UserPlus } from "lucide-react";

export default async function RegisterPage() {
  // Already logged in (real, existing user) → skip the auth page.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
            <UserPlus className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Join Catering Shifts Planner and start organizing your team.
          </p>
        </div>

        <RegisterForm />

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-amber-700 hover:underline dark:text-amber-500"
          >
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
