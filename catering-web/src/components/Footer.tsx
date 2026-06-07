import { ChefHat } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:px-6 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <ChefHat className="h-4 w-4" aria-hidden />
          </span>
          <p>© {year} Catering Shifts Planner</p>
        </div>
        <p>Plan and organize catering shifts with your team.</p>
      </div>
    </footer>
  );
}
