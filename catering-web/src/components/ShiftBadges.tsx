import type { ShiftState } from "@/services/shifts";
import { Ban, Clock, History, CircleDot, Users, Gauge, AlertTriangle } from "lucide-react";

const base =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium";

const temporalStyles: Record<ShiftState["temporal"], string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  current: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  past: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

const temporalIcons: Record<ShiftState["temporal"], typeof Clock> = {
  upcoming: Clock,
  current: CircleDot,
  past: History,
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

const capacityIcons: Record<ShiftState["capacity"], typeof Users> = {
  under: Users,
  full: Gauge,
  over: AlertTriangle,
};

const capacityLabels: Record<ShiftState["capacity"], string> = {
  under: "Under capacity",
  full: "Full",
  over: "Over capacity",
};

export default function ShiftBadges({ state }: { state: ShiftState }) {
  const TemporalIcon = temporalIcons[state.temporal];
  const CapacityIcon = capacityIcons[state.capacity];

  return (
    <div className="flex flex-wrap gap-1.5">
      {state.canceled && (
        <span
          className={`${base} bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300`}
        >
          <Ban className="h-3 w-3" aria-hidden />
          Canceled
        </span>
      )}
      <span className={`${base} ${temporalStyles[state.temporal]}`}>
        <TemporalIcon className="h-3 w-3" aria-hidden />
        {temporalLabels[state.temporal]}
      </span>
      <span className={`${base} ${capacityStyles[state.capacity]}`}>
        <CapacityIcon className="h-3 w-3" aria-hidden />
        {capacityLabels[state.capacity]}
      </span>
    </div>
  );
}
