import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getGroupOverview } from "@/services/groups";
import { deleteGroupAction } from "@/lib/group-actions";
import { ArrowLeft, ShieldAlert, Trash2, AlertTriangle } from "lucide-react";

export default async function DeleteGroupPage({
  params,
}: PageProps<"/groups/[id]/delete">) {
  const user = await verifySession();

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const group = await getGroupOverview(groupId, user.id);
  if (!group) notFound();

  if (!group.isMember || !group.isManager) {
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
          delete this group.
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

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-16 sm:px-6">
      <Link
        href={`/groups/${groupId}/edit`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to edit
      </Link>

      <div className="mt-6 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50/60 p-8 text-center dark:border-red-900/40 dark:bg-red-950/20">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <AlertTriangle className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Delete this group?
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This will permanently remove{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            &ldquo;{group.title}&rdquo;
          </span>
          , along with all of its shifts, joins, comments, invites and
          memberships ({group.memberCount + group.managers.length}{" "}
          {group.memberCount + group.managers.length === 1 ? "person" : "people"},{" "}
          {group.shiftCount} {group.shiftCount === 1 ? "shift" : "shifts"}). This
          action cannot be undone.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <form action={deleteGroupAction.bind(null, groupId)}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Yes, delete group
            </button>
          </form>
          <Link
            href={`/groups/${groupId}/edit`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-black/15 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Cancel
          </Link>
        </div>
      </div>
    </section>
  );
}
