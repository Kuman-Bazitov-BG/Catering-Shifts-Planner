import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getShiftDetail, formatShiftDateTime } from "@/services/shifts";
import ShiftBadges from "@/components/ShiftBadges";

// Minimal read-only shift page (the card link target). Join/leave, extra slots,
// and comments are added in Step 9.
export default async function ShiftPage({
  params,
}: PageProps<"/shifts/[id]">) {
  const user = await verifySession();

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) notFound();

  const shift = await getShiftDetail(shiftId, user.id);
  if (!shift) notFound();

  if (!shift.isMember) {
    return (
      <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You must be a member of{" "}
          <span className="font-medium">{shift.groupTitle}</span> to view this
          shift.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          ← Back to dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        ← Back to dashboard
      </Link>

      <header className="mt-4 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {shift.title}
        </h1>
        <ShiftBadges state={shift.state} />
      </header>

      <dl className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-black/10 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500 dark:text-zinc-400">Date &amp; time</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {formatShiftDateTime(shift.date, shift.startTime)} – {shift.endTime.slice(0, 5)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500 dark:text-zinc-400">Location</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.location ?? "No location"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500 dark:text-zinc-400">Group</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.groupTitle}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500 dark:text-zinc-400">Staff</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.staffCount} / {shift.capacity}
          </dd>
        </div>
      </dl>

      {/* Staff list */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Staff joined ({shift.staff.length})
        </h2>
        {shift.staff.length > 0 ? (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-950">
            {shift.staff.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-zinc-900 dark:text-zinc-50">
                  {member.name}
                </span>
                {member.extraSlots > 0 && (
                  <span className="text-zinc-500 dark:text-zinc-400">
                    +{member.extraSlots} extra
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            No staff have joined this shift yet.
          </p>
        )}
      </div>

      <p className="mt-8 rounded-lg border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
        Joining/leaving, reserving extra slots, and comments will be added in the
        next step.
      </p>
    </section>
  );
}
