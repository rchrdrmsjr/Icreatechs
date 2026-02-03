export default function UsagePage() {
  const usage = [
    { metric: "AI Completions", current: 8423, limit: 10000 },
    { metric: "Projects", current: 12, limit: "Unlimited" },
    { metric: "Storage", current: "24 GB", limit: "50 GB" },
    { metric: "Team Members", current: 3, limit: 5 },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Usage</h1>
        <p className="text-muted-foreground">
          Track your resource usage and limits
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {usage.map((item) => {
          const isUnlimited = item.limit === "Unlimited";
          const percentage = isUnlimited
            ? 0
            : (Number(item.current) / Number(item.limit)) * 100;

          return (
            <div key={item.metric} className="rounded-lg border border-border p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-semibold">{item.metric}</div>
                <div className="text-sm text-muted-foreground">
                  {item.current} / {item.limit}
                </div>
              </div>
              {!isUnlimited && (
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-foreground"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 text-xl font-semibold">Usage History</h2>
        <div className="space-y-3">
          {[
            { date: "Today", completions: 342, projects: 2 },
            { date: "Yesterday", completions: 521, projects: 3 },
            { date: "2 days ago", completions: 418, projects: 1 },
          ].map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0"
            >
              <div className="text-sm text-muted-foreground">{day.date}</div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Completions:</span>{" "}
                  <span className="font-medium">{day.completions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Projects:</span>{" "}
                  <span className="font-medium">{day.projects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}