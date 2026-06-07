import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getGroupDetail } from "@/services/groups";
import ShiftCard from "@/components/ShiftCard";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Users,
  CalendarClock,
  Info,
} from "lucide-react";

export default async function GroupPage({
  params,
}: PageProps<"/groups/[id]">) {
  const user = await verifySession();

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const group = await getGroupDetail(groupId, user.id);
  if (!group) notFound();

  // Only group members may view a group's details.
  if (!group.isMember) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You must be a member of <span className="font-medium">{group.title}</span>{" "}
          to view this group.
        </p>
        <Link
          href="/groups"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to your groups
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to your groups
      </Link>

      <header className="mt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {group.title}
          </h1>
          {group.isManager && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              You manage this group
            </span>
          )}
        </div>
        {group.description && (
          <p className="inline-flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {group.description}
          </p>
        )}
      </header>

      {/* Managers */}
      <div className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Managers ({group.managers.length})
        </h2>
        <MemberList members={group.managers} currentUserId={user.id} emptyText="No managers yet." />
      </div>

      {/* Members */}
      <div className="mt-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Users className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Members ({group.members.length})
        </h2>
        <MemberList members={group.members} currentUserId={user.id} emptyText="No other members yet." />
      </div>

      {/* Shifts */}
      <div className="mt-8">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Shifts ({group.shifts.length})
        </h2>
        {group.shifts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {group.shifts.map((shift) => (
              <ShiftCard key={shift.id} shift={shift} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            No shifts have been scheduled for this group yet.
          </p>
        )}
      </div>
    </section>
  );
}

function MemberList({
  members,
  currentUserId,
  emptyText,
}: {
  members: { userId: number; name: string; isManager: boolean }[];
  currentUserId: number;
  emptyText: string;
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/15 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-950">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex items-center justify-between px-5 py-3 text-sm"
        >
          <span className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-zinc-50">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            {member.name}
            {member.userId === currentUserId && (
              <span className="text-xs text-amber-700 dark:text-amber-500">(you)</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
