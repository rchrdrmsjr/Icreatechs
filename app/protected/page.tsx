import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg border border-border bg-card" />
            <div>
              <div className="text-sm text-muted-foreground">Workspace</div>
              <div className="text-lg font-semibold">iCreatechs IDE</div>
            </div>
          </div>
          <div className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            Protected
          </div>
        </header>

        <main className="grid flex-1 gap-4 md:grid-cols-[260px_1fr]">
          <aside className="rounded-lg border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Explorer
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-md bg-muted px-2 py-1">/app</div>
              <div className="rounded-md px-2 py-1">/components</div>
              <div className="rounded-md px-2 py-1">/utils</div>
              <div className="rounded-md px-2 py-1">/protected</div>
            </div>
          </aside>

          <section className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Active file</div>
                <div className="text-base font-semibold">
                  protected/page.tsx
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Signed in as {user?.email ?? "unknown"}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm">
              <div className="font-semibold">Access granted</div>
              <p className="mt-2 text-muted-foreground">
                You are viewing a protected route. This page renders only when a
                valid Supabase session is present.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
