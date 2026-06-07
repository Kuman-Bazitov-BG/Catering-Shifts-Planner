"use client";

import { useActionState } from "react";
import type { GroupFormState } from "@/lib/group-actions";
import { Type, AlignLeft, Save, PlusCircle, AlertCircle, Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50";

export type GroupFormDefaults = {
  title: string;
  description: string;
};

export default function GroupForm({
  action,
  defaults,
  submitLabel,
  pendingLabel,
  isEdit,
}: {
  action: (prevState: GroupFormState, formData: FormData) => Promise<GroupFormState>;
  defaults: GroupFormDefaults;
  submitLabel: string;
  pendingLabel: string;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState<GroupFormState, FormData>(
    action,
    undefined,
  );
  const v = state?.values ?? defaults;

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Title
        </label>
        <div className="relative">
          <Type className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={v.title ?? defaults.title}
            placeholder="e.g. City Catering Team"
            className={inputClass}
          />
        </div>
        {state?.errors?.title && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <div className="relative">
          <AlignLeft className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-zinc-400" aria-hidden />
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={v.description ?? defaults.description}
            placeholder="What does this group do, and who is it for?"
            className={`${inputClass} resize-y pt-2`}
          />
        </div>
        {state?.errors?.description && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.description[0]}</p>
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
            {pendingLabel}
          </>
        ) : isEdit ? (
          <>
            <Save className="h-4 w-4" aria-hidden />
            {submitLabel}
          </>
        ) : (
          <>
            <PlusCircle className="h-4 w-4" aria-hidden />
            {submitLabel}
          </>
        )}
      </button>
    </form>
  );
}
