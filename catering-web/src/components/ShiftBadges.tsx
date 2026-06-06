import type { ShiftState } from "@/services/shifts";

const base =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const temporalStyles: Record<ShiftState["temporal"], string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  current: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  past: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const temporalLabels: Record<ShiftState["temporal"], string> = {
  upcoming: "Upcoming",
  current: "Current",
  past: "Past",
};

const capacityStyles: Record<ShiftState["capacity"], string> = {
  under: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  full: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  over: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const capacityLabels: Record<ShiftState["capacity"], string> = {
  under: "Under capacity",
  full: "Full",
  over: "Over capacity",
};

export default function ShiftBadges({ state }: { state: ShiftState }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {state.canceled && (
        <span
          className={`${base} bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300`}
        >
          Canceled
        </span>
      )}
      <span className={`${base} ${temporalStyles[state.temporal]}`}>
        {temporalLabels[state.temporal]}
      </span>
      <span className={`${base} ${capacityStyles[state.capacity]}`}>
        {capacityLabels[state.capacity]}
      </span>
    </div>
  );
}
