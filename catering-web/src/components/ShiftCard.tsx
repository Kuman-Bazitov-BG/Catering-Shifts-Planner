import Link from "next/link";
import ShiftBadges from "./ShiftBadges";
import { formatShiftDateTime, type ShiftSummary } from "@/services/shifts";

export default function ShiftCard({ shift }: { shift: ShiftSummary }) {
  return (
    <Link
      href={`/shifts/${shift.id}`}
      className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-amber-600/50 hover:bg-amber-50/40 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-amber-500/40 dark:hover:bg-amber-950/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            {shift.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatShiftDateTime(shift.date, shift.startTime)}
          </p>
        </div>
      </div>

      <ShiftBadges state={shift.state} />

      <dl className="grid grid-cols-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <dt className="sr-only">Location</dt>
        <dd className="col-span-2">📍 {shift.location ?? "No location"}</dd>
        <dt className="sr-only">Group</dt>
        <dd className="col-span-2">👥 {shift.groupTitle}</dd>
      </dl>

      <div className="mt-auto flex items-center gap-4 border-t border-black/5 pt-3 text-sm text-zinc-600 dark:border-white/5 dark:text-zinc-400">
        <span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {shift.staffCount}
          </span>
          /{shift.capacity} staff
        </span>
        <span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {shift.commentCount}
          </span>{" "}
          {shift.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
    </Link>
  );
}
