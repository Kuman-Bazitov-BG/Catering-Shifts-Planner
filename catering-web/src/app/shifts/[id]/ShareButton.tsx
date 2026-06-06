"use client";

import { useState } from "react";

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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-4 w-4"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
        />
      </svg>
      {copied ? "Link copied!" : "Share shift link"}
    </button>
  );
}
