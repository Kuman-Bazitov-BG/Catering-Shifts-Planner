"use client";

import { useState, useTransition } from "react";
import {
  joinShift,
  leaveShift,
  setExtraSlots,
  type ShiftActionResult,
} from "@/lib/shift-actions";

const MAX_EXTRA_SLOTS = 3;

export default function ShiftControls({
  shiftId,
  isJoined,
  extraSlots,
  canParticipate,
}: {
  shiftId: number;
  isJoined: boolean;
  extraSlots: number;
  canParticipate: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ShiftActionResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if ("error" in res) setError(res.error);
    });
  }

  if (!canParticipate) {
    return (
      <p className="rounded-lg border border-black/10 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-400">
        This shift is closed (past or canceled), so joining and leaving are
        disabled.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center gap-4">
        {isJoined ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => leaveShift(shiftId))}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-black/15 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            Leave shift
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => joinShift(shiftId))}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            Join shift
          </button>
        )}

        {isJoined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              Extra slots
            </span>
            <button
              type="button"
              disabled={pending || extraSlots <= 0}
              onClick={() => run(() => setExtraSlots(shiftId, extraSlots - 1))}
              aria-label="Remove an extra slot"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-lg leading-none text-zinc-900 transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {extraSlots}
            </span>
            <button
              type="button"
              disabled={pending || extraSlots >= MAX_EXTRA_SLOTS}
              onClick={() => run(() => setExtraSlots(shiftId, extraSlots + 1))}
              aria-label="Add an extra slot"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-lg leading-none text-zinc-900 transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              +
            </button>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              (max {MAX_EXTRA_SLOTS})
            </span>
          </div>
        )}
      </div>

      {isJoined && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You&apos;re bringing{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {1 + extraSlots}
          </span>{" "}
          {1 + extraSlots === 1 ? "person" : "people"} (you + {extraSlots} extra).
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
