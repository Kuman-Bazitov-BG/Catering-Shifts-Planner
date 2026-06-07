import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import {
  getGroupOverview,
  getGroupMembersPaged,
  type GroupMemberInfo,
  type PagedGroupMembers,
} from "@/services/groups";
import MemberActions from "./MemberActions";
import { ArrowLeft, ShieldAlert, ShieldCheck, Users, ChevronLeft, ChevronRight } from "lucide-react";

const MEMBERS_PAGE_SIZE = 20;

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default async function GroupMembersPage({
  params,
  searchParams,
}: PageProps<"/groups/[id]/members">) {
  const user = await verifySession();

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const sp = await searchParams;
  const page = parsePage(sp.page);

  const group = await getGroupOverview(groupId, user.id);
  if (!group || !group.isMember) notFound();

  if (!group.isManager) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Only managers of <span className="font-medium">{group.title}</span> can
          manage members.
        </p>
        <Link
          href={`/groups/${groupId}`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to group
        </Link>
      </section>
    );
  }

  const members = await getGroupMembersPaged(groupId, { page, pageSize: MEMBERS_PAGE_SIZE });

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to group
      </Link>

      <header className="mt-4 flex flex-col gap-1.5">
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          <Users className="h-7 w-7 text-amber-600 dark:text-amber-500" aria-hidden />
          Manage members
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Promote members to manager, demote managers, or remove people from{" "}
          <span className="font-medium">{group.title}</span>.
        </p>
      </header>

      {/* Managers — full roster, typically small */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Managers ({group.managers.length})
        </h2>
        <MemberTable members={group.managers} groupId={groupId} currentUserId={user.id} emptyText="No managers yet." />
      </div>

      {/* Plain members — paginated, can be large */}
      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Members ({members.total})
        </h2>
        <MemberTable members={members.items} groupId={groupId} currentUserId={user.id} emptyText="This group has no other members yet." />
        <MembersPagination page={members} groupId={groupId} />
      </div>
    </section>
  );
}

function MembersPagination({ page, groupId }: { page: PagedGroupMembers; groupId: number }) {
  if (page.totalPages <= 1) return null;

  const canPrev = page.page > 1;
  const canNext = page.page < page.totalPages;

  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-between gap-3 text-sm">
      {canPrev ? (
        <Link
          href={`/groups/${groupId}/members?page=${page.page - 1}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/15 px-3 font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-zinc-500 dark:text-zinc-400">
        Page {page.page} of {page.totalPages}
      </span>

      {canNext ? (
        <Link
          href={`/groups/${groupId}/members?page=${page.page + 1}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black/15 px-3 font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-300 dark:hover:bg-white/10"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

function MemberTable({
  members,
  groupId,
  currentUserId,
  emptyText,
}: {
  members: GroupMemberInfo[];
  groupId: number;
  currentUserId: number;
  emptyText: string;
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white dark:divide-white/5 dark:border-white/10 dark:bg-zinc-950">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        >
          <span className="inline-flex items-center gap-2.5 text-sm text-zinc-900 dark:text-zinc-50">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            {member.name}
            {member.userId === currentUserId && (
              <span className="text-xs text-amber-700 dark:text-amber-500">(you)</span>
            )}
            {member.isManager && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Manager
              </span>
            )}
          </span>

          {member.userId !== currentUserId && (
            <MemberActions groupId={groupId} userId={member.userId} isManager={member.isManager} />
          )}
        </li>
      ))}
    </ul>
  );
}
