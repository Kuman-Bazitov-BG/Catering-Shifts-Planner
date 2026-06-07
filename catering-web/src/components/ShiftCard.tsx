import Link from "next/link";
import ShiftBadges from "./ShiftBadges";
import { formatShiftDateTime, type ShiftSummary } from "@/services/shifts";
import { MapPin, Users, MessageSquare, ChevronRight } from "lucide-react";

export default function ShiftCard({ shift }: { shift: ShiftSummary }) {
  return (
    <Link
      href={`/shifts/${shift.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-600/50 hover:bg-amber-50/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-950 dark:hover:border-amber-500/40 dark:hover:bg-amber-950/10"
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
        <ChevronRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600 dark:text-zinc-700"
          aria-hidden
        />
      </div>

      <ShiftBadges state={shift.state} />

      <dl className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Location</dt>
          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <dd className="truncate">{shift.location ?? "No location"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Group</dt>
          <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <dd className="truncate">{shift.groupTitle}</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center gap-4 border-t border-black/5 pt-3 text-sm text-zinc-600 dark:border-white/5 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {shift.staffCount}
          </span>
          /{shift.capacity}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {shift.commentCount}
          </span>{" "}
          {shift.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>
    </Link>
  );
}
