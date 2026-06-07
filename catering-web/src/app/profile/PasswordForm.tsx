"use client";

import { useActionState, useRef, useEffect } from "react";
import { updatePasswordAction, type PasswordFormState } from "@/lib/user-actions";
import { Lock, KeyRound, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordFormState, FormData>(
    updatePasswordAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {state?.message && (
        <p
          role="alert"
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            state.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          }`}
        >
          {state.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currentPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Current password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
        {state?.errors?.currentPassword && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.currentPassword[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            New password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {state?.errors?.newPassword && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.newPassword[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Confirm new password
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          {state?.errors?.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.confirmPassword[0]}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg border border-black/15 px-5 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/20 dark:text-zinc-50 dark:hover:bg-white/10"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Changing…
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" aria-hidden />
            Change password
          </>
        )}
      </button>
    </form>
  );
}
