import { verifySession } from "@/lib/dal";

// Placeholder dashboard — login/register redirect here, and it demonstrates a
// protected route. The full staff dashboard (active/archive shifts) is Step 8.
export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <section className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Welcome, {user.name}!
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        You are logged in as{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {user.email}
        </span>
        .
      </p>
      <p className="mt-6 rounded-lg border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
        This is a placeholder dashboard. The staff dashboard with your active and
        archived shifts will be built in a later step.
      </p>
    </section>
  );
}
