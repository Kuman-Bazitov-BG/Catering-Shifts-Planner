"use client";

import Link from "next/link";
import { useState } from "react";

// Public navigation links shown to visitors (not logged in).
// Logged-in links (Dashboard, Groups, Logout) are wired up in Step 6 (Authentication).
const links = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          onClick={() => setOpen(false)}
        >
          <span aria-hidden className="text-xl">
            🍽️
          </span>
          <span>Catering Shifts Planner</span>
        </Link>

        {/* Desktop / tablet nav */}
        <div className="hidden items-center gap-2 sm:flex">
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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
