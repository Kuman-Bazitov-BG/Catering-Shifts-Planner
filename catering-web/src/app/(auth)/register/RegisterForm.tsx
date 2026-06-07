"use client";

import { useActionState } from "react";
import { register, type AuthState } from "@/lib/auth-actions";
import { User, Mail, Lock, UserPlus, AlertCircle, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50";

export default function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    register,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <div className="relative">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            defaultValue={state?.values?.name ?? ""}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        {state?.errors?.name && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.errors.name[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={state?.values?.email ?? ""}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>
        {state?.errors?.email && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        {state?.errors?.password && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 px-4 text-sm font-medium text-white shadow-sm shadow-amber-600/30 transition-all hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" aria-hidden />
            Create account
          </>
        )}
      </button>
    </form>
  );
}
