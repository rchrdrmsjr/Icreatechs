export default function TeamPage() {
  const members = [
    {
      name: "John Doe",
      email: "john@example.com",
      role: "Owner",
      avatar: "👨",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      avatar: "👩",
    },
    {
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "Member",
      avatar: "👤",
    },
  ];

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members and permissions
          </p>
        </div>
        <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
          Invite Member
        </button>
      </div>

      <div className="rounded-lg border border-border">
        {members.map((member, index) => (
          <div
            key={member.email}
            className={`flex items-center justify-between p-4 ${
              index !== members.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl">
                {member.avatar}
              </div>
              <div>
                <div className="font-medium">{member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded bg-muted px-3 py-1 text-sm">
                {member.role}
              </div>
              {member.role !== "Owner" && (
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 text-xl font-semibold">Pending Invitations</h2>
        <div className="space-y-3">
          {[
            { email: "alice@example.com", sent: "2 days ago" },
            { email: "charlie@example.com", sent: "1 week ago" },
          ].map((invite) => (
            <div
              key={invite.email}
              className="flex items-center justify-between border-b border-border pb-3 last:border-0"
            >
              <div>
                <div className="font-medium">{invite.email}</div>
                <div className="text-sm text-muted-foreground">
                  Sent {invite.sent}
                </div>
              </div>
              <button className="text-sm text-red-600 hover:underline dark:text-red-400">
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
