import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-xl font-semibold">Current Plan</h2>
          <div className="mb-4">
            <div className="text-3xl font-bold">Pro</div>
            <div className="text-muted-foreground">$20/month</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-foreground">✓</span>
              Unlimited projects
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">✓</span>
              Advanced AI features
            </div>
            <div className="flex items-center gap-2">
              <span className="text-foreground">✓</span>
              Priority support
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Link
              href="/pricing"
              className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm hover:bg-accent"
            >
              Change Plan
            </Link>
            <button className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400">
              Cancel
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-6">
          <h2 className="mb-4 text-xl font-semibold">Payment Method</h2>
          <div className="mb-4 flex items-center gap-4 rounded-lg border border-border p-4">
            <div className="text-2xl">💳</div>
            <div className="flex-1">
              <div className="font-medium">•••• •••• •••• 4242</div>
              <div className="text-sm text-muted-foreground">Expires 12/2026</div>
            </div>
          </div>
          <button className="w-full rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
            Update Payment Method
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 text-xl font-semibold">Billing History</h2>
        <div className="space-y-3">
          {[
            { date: "Feb 1, 2026", amount: "$20.00", status: "Paid" },
            { date: "Jan 1, 2026", amount: "$20.00", status: "Paid" },
            { date: "Dec 1, 2025", amount: "$20.00", status: "Paid" },
          ].map((invoice) => (
            <div
              key={invoice.date}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0"
            >
              <div>
                <div className="font-medium">{invoice.date}</div>
                <div className="text-sm text-muted-foreground">Pro Plan</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="font-medium">{invoice.amount}</div>
                <div className="rounded bg-green-500/10 px-2 py-1 text-xs text-green-600 dark:text-green-400">
                  {invoice.status}
                </div>
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}