import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createGroupAction } from "@/lib/group-actions";
import GroupForm from "../GroupForm";
import { ArrowLeft, Users2 } from "lucide-react";

export default async function NewGroupPage() {
  const user = await verifySession();

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:underline dark:text-amber-500"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to your groups
      </Link>

      <header className="mt-4 mb-6 flex flex-col gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <Users2 className="h-3.5 w-3.5" aria-hidden />
          New group
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create a group, {user.name}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          You&apos;ll automatically become its first manager — invite others and
          start scheduling shifts once it&apos;s created.
        </p>
      </header>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
        <GroupForm
          action={createGroupAction}
          defaults={{ title: "", description: "" }}
          submitLabel="Create group"
          pendingLabel="Creating…"
        />
      </div>
    </section>
  );
}
