import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getShiftDetail, formatShiftDateTime } from "@/services/shifts";
import ShiftBadges from "@/components/ShiftBadges";
import ShiftControls from "./ShiftControls";
import ShareButton from "./ShareButton";
import CommentsSection from "./CommentsSection";
import {
  ArrowLeft,
  ShieldAlert,
  CalendarClock,
  MapPin,
  Users,
  MessageSquare,
} from "lucide-react";

export default async function ShiftPage({
  params,
}: PageProps<"/shifts/[id]">) {
  const user = await verifySession();

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) notFound();

  const shift = await getShiftDetail(shiftId, user.id);
  if (!shift) notFound();

  // Only group members may view a shift.
  if (!shift.isMember) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You must be a member of{" "}
          <span className="font-medium">{shift.groupTitle}</span> to view this
          shift.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
      </section>
    );
  }

  const isJoined = shift.currentUserExtraSlots !== null;

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
        <ShareButton />
      </div>

      <header className="mt-4 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {shift.title}
        </h1>
        <ShiftBadges state={shift.state} />
      </header>

      {/* Shift info */}
      <dl className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-black/10 bg-white p-5 text-sm dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-4">
          <dt className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
            Date &amp; time
          </dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {formatShiftDateTime(shift.date, shift.startTime)} –{" "}
            {shift.endTime.slice(0, 5)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            Location
          </dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.location ?? "No location"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Group
          </dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.groupTitle}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Staff
          </dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {shift.staffCount} / {shift.capacity}
          </dd>
        </div>
      </dl>

      {/* Join / leave / extra slots */}
      <div className="mt-6">
        <ShiftControls
          shiftId={shift.id}
          isJoined={isJoined}
          extraSlots={shift.currentUserExtraSlots ?? 0}
          canParticipate={shift.state.isActive}
        />
      </div>

      {/* Staff list */}
      <div className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Users className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Staff joined ({shift.staff.length})
        </h2>
        {shift.staff.length > 0 ? (
          <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-950">
            {shift.staff.map((member) => (
              <li
                key={member.userId}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-zinc-50">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    {member.name.slice(0, 1).toUpperCase()}
                  </span>
                  {member.name}
                  {member.userId === user.id && (
                    <span className="text-xs text-amber-700 dark:text-amber-500">
                      (you)
                    </span>
                  )}
                </span>
                {member.extraSlots > 0 && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
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

      {/* Comments */}
      <div className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Comments ({shift.comments.length})
        </h2>
        <CommentsSection
          shiftId={shift.id}
          comments={shift.comments}
          currentUserId={user.id}
          isManager={shift.currentUserIsManager}
        />
      </div>
    </section>
  );
}
