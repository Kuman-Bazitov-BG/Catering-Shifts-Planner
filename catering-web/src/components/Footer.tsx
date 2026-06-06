export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:px-6 dark:text-zinc-400">
        <p>© {year} Catering Shifts Planner</p>
        <p>Plan and organize catering shifts with your team.</p>
      </div>
    </footer>
  );
}
