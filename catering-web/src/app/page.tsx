import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <span
          aria-hidden
          className="text-5xl sm:text-6xl"
        >
          🍽️
        </span>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Welcome to Catering Shifts Planner
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Organize your catering team around groups and shifts. Create a group,
            schedule shifts for your events, and let bartenders and waiters join,
            leave, and comment — all in one place.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-full border border-black/15 px-8 text-base font-medium text-zinc-900 transition-colors hover:bg-black/5 sm:w-auto dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-full bg-amber-600 px-8 text-base font-medium text-white transition-colors hover:bg-amber-700 sm:w-auto"
          >
            Register
          </Link>
        </div>
      </div>
    </section>
  );
}
