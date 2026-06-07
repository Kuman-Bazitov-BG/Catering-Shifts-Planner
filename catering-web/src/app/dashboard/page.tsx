import { verifySession } from "@/lib/dal";
import { getDashboardShifts } from "@/services/shifts";
import ShiftCard from "@/components/ShiftCard";
import { CalendarClock, Archive, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const user = await verifySession();
  const { active, archive } = await getDashboardShifts(user.id);

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-2 rounded-2xl border border-black/10 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-white/10 dark:from-amber-950/20 dark:to-orange-950/10">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
          <Sparkles className="h-4 w-4" aria-hidden />
          Staff Dashboard
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Welcome back, {user.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Browse the shifts in your groups, see who&apos;s joining, and keep up with the conversation.
        </p>
      </header>

      {/* Active Shifts — main section */}
      <div className="mb-12">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Active Shifts
        </h2>
        {active.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            No active shifts right now. Upcoming and current shifts that are open
            to join will appear here.
          </p>
        )}
      </div>

      {/* Archive Shifts — secondary section */}
      <div>
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-zinc-500 dark:text-zinc-400">
          <Archive className="h-5 w-5" aria-hidden />
          Archive Shifts
        </h2>
        {archive.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archive.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            No past or canceled shifts yet.
          </p>
        )}
      </div>
    </section>
  );
}
