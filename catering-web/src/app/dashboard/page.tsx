import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { getDashboardShiftsPaged, type PagedShiftSummaries } from "@/services/shifts";
import ShiftCard from "@/components/ShiftCard";
import SearchBox from "@/components/SearchBox";
import { CalendarClock, Archive, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 9;

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parseSearch(value: string | string[] | undefined): string {
  const s = Array.isArray(value) ? value[0] : value;
  return s?.trim() ?? "";
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await verifySession();
  const params = await searchParams;

  const activePage = parsePage(params.activePage);
  const archivePage = parsePage(params.archivePage);
  const search = parseSearch(params.search);

  const { active, archive } = await getDashboardShiftsPaged(user.id, {
    activePage,
    archivePage,
    pageSize: PAGE_SIZE,
    search,
  });

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

      <div className="mb-8 sm:max-w-sm">
        <SearchBox
          placeholder="Search shifts by name, date, or location…"
          pageParams={["activePage", "archivePage"]}
        />
      </div>

      {/* Active Shifts — main section */}
      <div className="mb-12">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          <CalendarClock className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
          Active Shifts
        </h2>
        {active.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.items.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
            <PaginationControls
              paramName="activePage"
              otherParamName="archivePage"
              otherParamValue={archivePage}
              search={search}
              page={active}
            />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            {search
              ? `No active shifts match "${search}".`
              : "No active shifts right now. Upcoming and current shifts that are open to join will appear here."}
          </p>
        )}
      </div>

      {/* Archive Shifts — secondary section */}
      <div>
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-zinc-500 dark:text-zinc-400">
          <Archive className="h-5 w-5" aria-hidden />
          Archive Shifts
        </h2>
        {archive.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archive.items.map((shift) => (
                <ShiftCard key={shift.id} shift={shift} />
              ))}
            </div>
            <PaginationControls
              paramName="archivePage"
              otherParamName="activePage"
              otherParamValue={activePage}
              search={search}
              page={archive}
            />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-black/15 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
            {search ? `No archived shifts match "${search}".` : "No past or canceled shifts yet."}
          </p>
        )}
      </div>
    </section>
  );
}

function PaginationControls({
  paramName,
  otherParamName,
  otherParamValue,
  search,
  page,
}: {
  paramName: "activePage" | "archivePage";
  otherParamName: "activePage" | "archivePage";
  otherParamValue: number;
  search: string;
  page: PagedShiftSummaries;
}) {
  if (page.totalPages <= 1) return null;

  function hrefFor(targetPage: number): string {
    const qs = new URLSearchParams();
    qs.set(paramName, String(targetPage));
    if (otherParamValue > 1) qs.set(otherParamName, String(otherParamValue));
    if (search) qs.set("search", search);
    return `/dashboard?${qs.toString()}`;
  }

  const canPrev = page.page > 1;
  const canNext = page.page < page.totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between gap-3 text-sm"
    >
      {canPrev ? (
        <Link
          href={hrefFor(page.page - 1)}
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
          href={hrefFor(page.page + 1)}
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
