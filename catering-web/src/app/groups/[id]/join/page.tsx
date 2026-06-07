import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { acceptGroupInvite } from "@/services/groups";
import { ArrowLeft, ArrowRight, PartyPopper, ShieldAlert } from "lucide-react";

export default async function JoinGroupPage({
  params,
  searchParams,
}: PageProps<"/groups/[id]/join">) {
  const { id } = await params;
  const groupId = Number(id);
  if (!Number.isInteger(groupId)) notFound();

  const sp = await searchParams;
  const codeRaw = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const code = (codeRaw ?? "").trim();

  // Not logged in → send to login, then back to this exact invite link.
  const user = await getCurrentUser();
  if (!user) {
    const target = `/groups/${groupId}/join?code=${encodeURIComponent(code)}`;
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }

  if (!code) {
    return <InviteError message="This invite link is invalid." />;
  }

  const result = await acceptGroupInvite(user.id, groupId, code);
  if ("error" in result) {
    return <InviteError message={result.error} />;
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <PartyPopper className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Welcome to {result.groupTitle}!
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        You&apos;ve successfully joined the group. You can now view its shifts and
        coordinate with the rest of the team.
      </p>
      <Link
        href={`/groups/${groupId}`}
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-amber-600 hover:to-orange-700"
      >
        Go to {result.groupTitle}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

function InviteError({ message }: { message: string }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-16 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
        <ShieldAlert className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Couldn&apos;t join this group
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{message}</p>
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
