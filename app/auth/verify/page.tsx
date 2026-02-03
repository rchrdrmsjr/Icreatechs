import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="mx-auto w-full max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <p className="text-sm text-muted-foreground">
        We sent a verification link to your email. Open it to finish creating
        your account.
      </p>
      <div className="text-xs text-muted-foreground">
        <Link href="/auth/sign-in">Back to sign in</Link>
      </div>
    </div>
  );
}