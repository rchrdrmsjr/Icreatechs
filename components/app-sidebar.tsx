"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProfile } from "./user-profile";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  CreditCard,
  Users,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

export function AppSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "AI Chat", icon: MessageSquare },
    { href: "/app/projects", label: "Projects", icon: FolderOpen },
    { href: "/app/templates", label: "Templates", icon: FileText },
    { href: "/app/usage", label: "Usage", icon: BarChart3 },
    { href: "/app/billing", label: "Billing", icon: CreditCard },
    { href: "/app/team", label: "Team", icon: Users },
    { href: "/app/account", label: "Account", icon: Settings },
  ];

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-background transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold">
            iCreateTechs
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 hover:bg-accent"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title={isCollapsed ? link.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <UserProfile isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
}
