"use client";

import { useState, useTransition } from "react";
import { createInviteAction } from "@/lib/group-invite-actions";
import { UserPlus, Link2, Check, AlertCircle, Loader2 } from "lucide-react";

export default function CreateInviteButton({ groupId }: { groupId: number }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCreate() {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const res = await createInviteAction(groupId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setLink(`${window.location.origin}/groups/${groupId}/join?code=${res.code}`);
    });
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={handleCreate}
        className="inline-flex items-center gap-1.5 self-start rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        Create invite link
      </button>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {link && (
        <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Share this one-time link with the person you want to invite. It can only
            be used once, by one person.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-black/10 bg-white px-3 py-2 text-xs text-zinc-700 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
              {link}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-black/15 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
