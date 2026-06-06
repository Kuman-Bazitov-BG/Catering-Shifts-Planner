"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/dal";

function LogoutButton({ className }: { className: string }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        Logout
      </button>
    </form>
  );
}

export default function Header({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          onClick={close}
        >
          <span aria-hidden className="text-xl">
            🍽️
          </span>
          <span>Catering Shifts Planner</span>
        </Link>

        {/* Desktop / tablet nav */}
        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Dashboard
              </Link>
              <span className="px-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {user.name}
              </span>
              <LogoutButton className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 transition-colors hover:bg-black/5 sm:hidden dark:text-zinc-200 dark:hover:bg-white/10"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile dropdown menu */}
      {open && (
        <div
          id="mobile-menu"
          className="border-t border-black/10 px-4 py-3 sm:hidden dark:border-white/10"
        >
          <div className="flex flex-col gap-1">
            {user ? (
              <>
                <span className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Signed in as {user.name}
                </span>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Dashboard
                </Link>
                <LogoutButton className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10" />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={close}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
