import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { getUserGroupsPaged } from "@/services/groups";
import {
  Users,
  ChevronRight,
  CalendarClock,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

const PAGE_SIZE = 12;

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export default async function GroupsPage({
  searchParams,
}: PageProps<"/groups">) {
  const user = await verifySession();
  const params = await searchParams;
  const page = parsePage(params.page);

  const userGroups = await getUserGroupsPaged(user.id, { page, pageSize: PAGE_SIZE });

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-2 rounded-2xl border border-black/10 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-white/10 dark:from-amber-950/20 dark:to-orange-950/10">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
          <Sparkles className="h-4 w-4" aria-hidden />
          My Groups
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Your groups, {user.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Groups you belong to — view their members, managers, and shifts.
        </p>
      </header>

      {userGroups.items.length > 0 ? (
        <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userGroups.items.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-600/50 hover:bg-amber-50/40 hover:shadow-md dark:border-white/10 dark:bg-zinc-950 dark:hover:border-amber-500/40 dark:hover:bg-amber-950/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {group.title}
                  </h3>
                  {group.description && (
                    <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {group.description}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600 dark:text-zinc-700"
                  aria-hidden
                />
              </div>

              {group.isManager && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Manager
                </span>
              )}

              <div className="mt-auto flex items-center gap-4 border-t border-black/5 pt-3 text-sm text-zinc-600 dark:border-white/5 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-zinc-400 dark:text-zinc-500" aria-hidden />
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {group.memberCount}
                  </span>{" "}
                  {group.memberCount === 1 ? "member" : "members"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarClock className="h-4 w-4 text-zinc-400 dark:text-zinc-500" aria-hidden />
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {group.shiftCount}
                  </span>{" "}
                  {group.shiftCount === 1 ? "shift" : "shifts"}
                </span>
              </div>
            </Link>
          ))}
        </div>
        <GroupsPagination page={userGroups} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
          You are not a member of any groups yet.
        </p>
      )}
    </section>
  );
}

function GroupsPagination({
  page,
}: {
  page: { page: number; totalPages: number };
}) {
  if (page.totalPages <= 1) return null;

  const canPrev = page.page > 1;
  const canNext = page.page < page.totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-between gap-3 text-sm"
    >
      {canPrev ? (
        <Link
          href={`/groups?page=${page.page - 1}`}
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
          href={`/groups?page=${page.page + 1}`}
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
