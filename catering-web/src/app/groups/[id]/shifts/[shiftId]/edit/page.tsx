import Link from "next/link";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { getShiftEditInfo } from "@/services/shifts";
import { updateShiftAction } from "@/lib/group-shift-actions";
import ShiftForm from "../../ShiftForm";
import { ArrowLeft, ShieldAlert, PencilLine } from "lucide-react";

export default async function EditShiftPage({
  params,
}: PageProps<"/groups/[id]/shifts/[shiftId]/edit">) {
  const user = await verifySession();

  const { id, shiftId: shiftIdParam } = await params;
  const groupId = Number(id);
  const shiftId = Number(shiftIdParam);
  if (!Number.isInteger(groupId) || !Number.isInteger(shiftId)) notFound();

  const shift = await getShiftEditInfo(shiftId, user.id);
  if (!shift || shift.groupId !== groupId) notFound();

  if (!shift.isManager) {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access denied
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Only managers of <span className="font-medium">{shift.groupTitle}</span>{" "}
          can edit shifts.
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
        Back to {shift.groupTitle}
      </Link>

      <header className="mt-4 mb-6 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <PencilLine className="h-3.5 w-3.5" aria-hidden />
          Edit shift
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {shift.title}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Update the shift&apos;s details, or cancel it without deleting it.
        </p>
      </header>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
        <ShiftForm
          action={updateShiftAction.bind(null, groupId, shiftId)}
          defaults={{
            title: shift.title,
            date: shift.date,
            startTime: shift.startTime.slice(0, 5),
            endTime: shift.endTime.slice(0, 5),
            location: shift.location ?? "",
            capacity: String(shift.capacity),
            canceled: shift.canceled,
          }}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          showCancelToggle
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/groups/${groupId}/shifts/${shiftId}/delete`}
          className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
        >
          Delete this shift
        </Link>
      </div>
    </section>
  );
}
