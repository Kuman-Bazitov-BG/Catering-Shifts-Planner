"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PageJump({
  page,
  totalPages,
  basePath,
  extraParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  // Extra query params (e.g. an active search term) to keep across the jump.
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(page));

  function jump(target: number) {
    if (!Number.isInteger(target)) return;
    const clamped = Math.min(Math.max(target, 1), totalPages);
    setEditing(false);
    const qs = new URLSearchParams(extraParams);
    qs.set("page", String(clamped));
    router.push(`${basePath}?${qs.toString()}`);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        Page{" "}
        <input
          autoFocus
          type="number"
          min={1}
          max={totalPages}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              jump(Number(value));
            } else if (e.key === "Escape") {
              setValue(String(page));
              setEditing(false);
            }
          }}
          className="h-7 w-14 rounded-md border border-black/15 bg-white px-1.5 text-center text-zinc-900 outline-none focus:border-amber-600/50 dark:border-white/20 dark:bg-zinc-950 dark:text-zinc-50"
        />{" "}
        of {totalPages}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(String(page));
        setEditing(true);
      }}
      className="rounded-md px-1 text-zinc-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
    >
      Page {page} of {totalPages}
    </button>
  );
}
