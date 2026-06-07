import { verifySession } from "@/lib/dal";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import { UserCircle, Lock, Sparkles } from "lucide-react";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ProfilePage() {
  const user = await verifySession();

  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-col gap-2 rounded-2xl border border-black/10 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-white/10 dark:from-amber-950/20 dark:to-orange-950/10">
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
          <Sparkles className="h-4 w-4" aria-hidden />
          My Profile
        </div>
        <div className="flex items-center gap-4">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoUrl}
              alt={user.name}
              className="h-14 w-14 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-lg font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              {initials(user.name)}
            </span>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {user.name}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <UserCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
            Profile details
          </h2>
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
            <ProfileForm
              defaults={{ name: user.name, photoUrl: user.photoUrl ?? "" }}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-500" aria-hidden />
            Change password
          </h2>
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-950">
            <PasswordForm />
          </div>
        </div>
      </div>
    </section>
  );
}
