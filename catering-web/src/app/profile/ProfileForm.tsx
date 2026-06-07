"use client";

import { useActionState } from "react";
import { updateProfileAction, type ProfileFormState } from "@/lib/user-actions";
import { User, Image as ImageIcon, Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50";

export default function ProfileForm({
  defaults,
}: {
  defaults: { name: string; photoUrl: string };
}) {
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    undefined,
  );
  const v = state?.values ?? defaults;

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            defaultValue={v.name ?? defaults.name}
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        {state?.errors?.name && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="photoUrl" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Photo URL <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <div className="relative">
          <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="photoUrl"
            name="photoUrl"
            type="url"
            defaultValue={v.photoUrl ?? defaults.photoUrl}
            placeholder="https://example.com/your-photo.jpg"
            className={inputClass}
          />
        </div>
        {state?.errors?.photoUrl && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.photoUrl[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-fit items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 px-5 text-sm font-medium text-white shadow-sm shadow-amber-600/30 transition-all hover:from-amber-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden />
            Save changes
          </>
        )}
      </button>
    </form>
  );
}
