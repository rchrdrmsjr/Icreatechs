"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AuthPanel() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const redirectTo = redirectedFrom ?? "/protected";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      setSessionEmail(session?.user.email ?? null);
      if (session?.user && redirectedFrom) {
        router.push(redirectedFrom);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      if (session?.user && redirectedFrom) {
        router.push(redirectedFrom);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, redirectedFrom]);

  const handleSignIn = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setStatus(error ? error.message : "Signed in");
  };

  const handleSignUp = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setStatus(error ? error.message : "Check your email to confirm");
  };

  const handleSignOut = async () => {
    setStatus(null);
    const { error } = await supabase.auth.signOut();
    setStatus(error ? error.message : "Signed out");
  };

  return (
    <div className="w-full max-w-sm space-y-4 rounded-lg border border-border p-4">
      <div className="text-sm text-muted-foreground">
        {sessionEmail ? `Signed in as ${sessionEmail}` : "No session"}
      </div>

      <div className="space-y-2">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          onClick={handleSignIn}
        >
          Sign in
        </button>
        <button
          type="button"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
          onClick={handleSignUp}
        >
          Sign up
        </button>
      </div>

      <button
        type="button"
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
        onClick={handleSignOut}
      >
        Sign out
      </button>

      {status && <div className="text-xs text-muted-foreground">{status}</div>}
    </div>
  );
}
