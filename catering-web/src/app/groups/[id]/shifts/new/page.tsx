import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getGroupDetail } from "@/services/groups";
import { createShiftAction } from "@/lib/group-shift-actions";
import ShiftForm from "../ShiftForm";
import { ArrowLeft, ShieldAlert, CalendarPlus } from "lucide-react";

export default async function NewShiftPage({
  params,
}: PageProps<"/groups/[id]/shifts/new">) {
  const user = await verifySession();

  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const group = await getGroupDetail(groupId, user.id);
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
          create shifts.
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
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to {group.title}
      </Link>

      <header className="mt-4 mb-6 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
          New shift
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create a shift for {group.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Set the date, time, location, and capacity. Members will be able to
          join once it&apos;s created.
        </p>
      </header>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
        <ShiftForm
          action={createShiftAction.bind(null, groupId)}
          defaults={{
            title: "",
            date: "",
            startTime: "",
            endTime: "",
            location: "",
            capacity: "50",
            canceled: false,
          }}
          submitLabel="Create shift"
          pendingLabel="Creating…"
        />
      </div>
    </section>
  );
}
