"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/auth-actions";
import type { CurrentUser } from "@/lib/dal";
import { ChefHat, LayoutDashboard, Users, LogOut, Menu, X } from "lucide-react";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function LogoutButton({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <form action={logout}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  );
}

export default function Header({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:border-white/10 dark:bg-zinc-950/80 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          onClick={close}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <ChefHat className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="hidden sm:inline">Catering Shifts Planner</span>
          <span className="sm:hidden">Catering Planner</span>
        </Link>

        {/* Desktop / tablet nav */}
        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden />
                Dashboard
              </Link>

              <Link
                href="/groups"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
              >
                <Users className="h-4 w-4" aria-hidden />
                Groups
              </Link>

              <span className="mx-1 h-6 w-px bg-black/10 dark:bg-white/10" aria-hidden />

              <span className="inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  {initials(user.name)}
                </span>
                {user.name}
              </span>

              <LogoutButton className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-amber-600 dark:hover:bg-amber-700">
                <LogOut className="h-4 w-4" aria-hidden />
                Logout
              </LogoutButton>
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
                className="rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-amber-600 hover:to-orange-700"
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
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
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
                <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                    {initials(user.name)}
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </span>
                </div>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </Link>
                <Link
                  href="/groups"
                  onClick={close}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  Groups
                </Link>
                <LogoutButton className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30">
                  <LogOut className="h-4 w-4" aria-hidden />
                  Logout
                </LogoutButton>
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
                  className="rounded-md bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-2 text-sm font-medium text-white shadow-sm"
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
