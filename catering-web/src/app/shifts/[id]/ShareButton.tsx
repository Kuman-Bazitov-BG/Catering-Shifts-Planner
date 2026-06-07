"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context); fail silently.
    }
  }

  return (
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
      {copied ? "Link copied!" : "Share shift link"}
    </button>
  );
}
