"use client";

import { useActionState } from "react";
import type { ShiftFormState } from "@/lib/group-shift-actions";
import {
  Type,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Ban,
  Save,
  PlusCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-black/15 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-50";

export type ShiftFormDefaults = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
  canceled: boolean;
};

export default function ShiftForm({
  action,
  defaults,
  submitLabel,
  pendingLabel,
  showCancelToggle,
}: {
  action: (prevState: ShiftFormState, formData: FormData) => Promise<ShiftFormState>;
  defaults: ShiftFormDefaults;
  submitLabel: string;
  pendingLabel: string;
  showCancelToggle?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ShiftFormState, FormData>(
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
            placeholder="e.g. The Grand Hall — Evening Service"
            className={inputClass}
          />
        </div>
        {state?.errors?.title && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Date
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={v.date ?? defaults.date}
              className={inputClass}
            />
          </div>
          {state?.errors?.date && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.date[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="startTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Start time
          </label>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={v.startTime ?? defaults.startTime}
              className={inputClass}
            />
          </div>
          {state?.errors?.startTime && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.startTime[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="endTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            End time
          </label>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={v.endTime ?? defaults.endTime}
              className={inputClass}
            />
          </div>
          {state?.errors?.endTime && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.endTime[0]}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Location <span className="font-normal text-zinc-400">(optional)</span>
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="location"
              name="location"
              type="text"
              defaultValue={v.location ?? defaults.location}
              placeholder="e.g. Riverside Venue"
              className={inputClass}
            />
          </div>
          {state?.errors?.location && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.location[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="capacity" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Capacity
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              required
              defaultValue={v.capacity ?? defaults.capacity}
              className={inputClass}
            />
          </div>
          {state?.errors?.capacity && (
            <p className="text-sm text-red-600 dark:text-red-400">{state.errors.capacity[0]}</p>
          )}
        </div>
      </div>

      {showCancelToggle && (
        <label className="inline-flex w-fit items-center gap-2.5 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10">
          <input
            type="checkbox"
            name="canceled"
            defaultChecked={v.canceled ?? defaults.canceled}
            className="h-4 w-4 rounded border-black/30 text-amber-600 focus:ring-amber-600/40 dark:border-white/30"
          />
          <Ban className="h-4 w-4 text-red-500" aria-hidden />
          Cancel this shift
        </label>
      )}

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
        ) : showCancelToggle ? (
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
