"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function UserProfile({ isCollapsed }: { isCollapsed?: boolean }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<any>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (!user) return null;

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const email = user.email;

  // Get initials from full name or email
  const getInitials = () => {
    if (user.user_metadata?.full_name || user.user_metadata?.name) {
      const name = user.user_metadata?.full_name || user.user_metadata?.name;
      const names = name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return email?.[0].toUpperCase() || "U";
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 rounded-lg p-2 hover:bg-accent ${
          isCollapsed ? "w-full justify-center" : "w-full"
        }`}
        title={isCollapsed ? fullName : undefined}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={fullName}
            referrerPolicy="no-referrer"
            className="h-8 w-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {getInitials()}
          </div>
        )}
        {!isCollapsed && (
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-sm font-medium truncate">{fullName}</div>
            <div className="text-xs text-muted-foreground truncate">
              {email}
            </div>
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 z-20 mb-2 w-64 rounded-lg border border-border bg-background shadow-lg">
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {getInitials()}
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="truncate text-sm font-medium">{fullName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {email}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2">
              <Link
                href="/app/account"
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
              >
                Account Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
