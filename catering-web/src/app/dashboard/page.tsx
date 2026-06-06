import { verifySession } from "@/lib/dal";
import { getDashboardShifts } from "@/services/shifts";
import ShiftCard from "@/components/ShiftCard";

export default async function DashboardPage() {
  const user = await verifySession();
  const { active, archive } = await getDashboardShifts(user.id);

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Staff Dashboard
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Welcome, {user.name}. Browse the shifts in your groups.
        </p>
      </header>

      {/* Active Shifts — main section */}
      <div className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
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
        <h2 className="mb-4 text-xl font-semibold text-zinc-500 dark:text-zinc-400">
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
