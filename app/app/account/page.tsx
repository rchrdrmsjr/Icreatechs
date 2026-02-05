import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border p-6">
          <h3 className="mb-4 font-semibold">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="mb-4 font-semibold">Security</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Current Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                New Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
              Update Password
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h3 className="mb-4 font-semibold">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive updates about your projects
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Marketing Emails</div>
                <div className="text-sm text-muted-foreground">
                  Product updates and feature announcements
                </div>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <h3 className="mb-2 font-semibold text-red-600 dark:text-red-400">
            Delete Account
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Permanently delete your account and all associated data.
          </p>
          <button className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
