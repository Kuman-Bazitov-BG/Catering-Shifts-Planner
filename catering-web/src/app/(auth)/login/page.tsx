import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="mb-6 flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Log in to manage your catering shifts.
          </p>
        </div>

        <LoginForm />

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
