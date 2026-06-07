"use client";

import { useState, useTransition } from "react";
import { leaveGroupAction } from "@/lib/group-member-actions";
import { LogOut, AlertCircle, Loader2 } from "lucide-react";

export default function LeaveGroupButton({ groupId }: { groupId: number }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const res = await leaveGroupAction(groupId);
      if (res && "error" in res) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Are you sure you want to leave this group? You&apos;ll need a new
          invite link to rejoin.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleLeave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white shadow-sm shadow-red-600/30 transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            Yes, leave group
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming(false)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-black/15 px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 self-start rounded-full border border-black/15 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Leave group
    </button>
  );
}
