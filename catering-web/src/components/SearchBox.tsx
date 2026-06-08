"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

// Debounced search box that drives navigation via the `search` URL param.
// Typing updates the URL (and resets any paging params to page 1) so the
// server component re-fetches a filtered, "starts with" page from the DB —
// matching the prefix-search behavior used in the mobile app.
export default function SearchBox({
  placeholder,
  pageParams = [],
}: {
  placeholder: string;
  pageParams?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync if the URL changes externally (e.g. back/forward).
  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function navigate(term: string) {
    const qs = new URLSearchParams(searchParams.toString());
    pageParams.forEach((p) => qs.delete(p));
    if (term) qs.set("search", term);
    else qs.delete("search");
    const query = qs.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate(next.trim()), 350);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    navigate("");
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 shadow-sm focus-within:border-amber-600/50 dark:border-white/10 dark:bg-zinc-950">
      <Search className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-500"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="shrink-0 rounded-full p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
