"use client";

import { useState, useTransition } from "react";
import { removeMemberAction, setMemberRoleAction } from "@/lib/group-member-actions";
import { ShieldCheck, ShieldOff, UserMinus, AlertCircle, Loader2 } from "lucide-react";

export default function MemberActions({
  groupId,
  userId,
  isManager,
}: {
  groupId: number;
  userId: number;
  isManager: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleRoleToggle() {
    setError(null);
    setConfirmingRemove(false);
    startTransition(async () => {
      const res = await setMemberRoleAction(groupId, userId, !isManager);
      if ("error" in res) setError(res.error);
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const res = await removeMemberAction(groupId, userId);
      if ("error" in res) {
        setError(res.error);
        setConfirmingRemove(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleRoleToggle}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-black/15 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : isManager ? (
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          )}
          {isManager ? "Demote" : "Promote"}
        </button>

        {confirmingRemove ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={handleRemove}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserMinus className="h-3.5 w-3.5" aria-hidden />
              Confirm remove
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmingRemove(false)}
              className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmingRemove(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <UserMinus className="h-3.5 w-3.5" aria-hidden />
            Remove
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
