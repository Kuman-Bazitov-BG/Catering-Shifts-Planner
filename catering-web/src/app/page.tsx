import Link from "next/link";
import { ChefHat, Users, CalendarClock, MessageSquare } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Groups & teams",
    description:
      "Organize your staff into groups, invite members, and manage managers with ease.",
  },
  {
    icon: CalendarClock,
    title: "Shift scheduling",
    description:
      "Create shifts for your events and watch their state update — upcoming, current, or past.",
  },
  {
    icon: MessageSquare,
    title: "Join & comment",
    description:
      "Bartenders and waiters join shifts, bring extra hands, and coordinate through comments.",
  },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        {/* Decorative background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 -z-10 flex justify-center"
        >
          <div className="h-72 w-[36rem] rounded-full bg-gradient-to-br from-amber-300/40 via-orange-300/30 to-transparent blur-3xl dark:from-amber-500/20 dark:via-orange-600/10" />
        </div>

        <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-600/20">
            <ChefHat className="h-8 w-8" strokeWidth={2} aria-hidden />
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
              href="/register"
              className="flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-8 text-base font-medium text-white shadow-sm shadow-amber-600/30 transition-all hover:from-amber-600 hover:to-orange-700 hover:shadow-md sm:w-auto"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="flex h-12 w-full items-center justify-center rounded-full border border-black/15 px-8 text-base font-medium text-zinc-900 transition-colors hover:bg-black/5 sm:w-auto dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-zinc-950"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
