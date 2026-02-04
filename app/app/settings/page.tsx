"use client";

import { useState } from "react";
import { Moon, Sun, Monitor, Bell, Globe, Lock, Palette } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    updates: true,
  });

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application preferences and settings
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Appearance */}
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <h3 className="font-semibold">Appearance</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    theme === "light"
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    theme === "dark"
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-sm">Dark</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                    theme === "system"
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-sm">System</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive email updates about your projects
                </div>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, email: !prev.email }))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications.email ? "bg-foreground" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                    notifications.email ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Get push notifications for important updates
                </div>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({ ...prev, push: !prev.push }))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications.push ? "bg-foreground" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                    notifications.push ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Product Updates</div>
                <div className="text-sm text-muted-foreground">
                  Stay informed about new features and improvements
                </div>
              </div>
              <button
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    updates: !prev.updates,
                  }))
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications.updates ? "bg-foreground" : "bg-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
                    notifications.updates ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <h3 className="font-semibold">Language & Region</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Language</label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Japanese</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                Time Zone
              </label>
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+0 (London)</option>
                <option>UTC+1 (Paris)</option>
                <option>UTC+9 (Tokyo)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-lg border border-border p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <h3 className="font-semibold">Privacy</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Analytics</div>
                <div className="text-sm text-muted-foreground">
                  Help us improve by sharing anonymous usage data
                </div>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-foreground transition-colors">
                <div className="absolute top-0.5 h-5 w-5 translate-x-5 rounded-full bg-background transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Error Reporting</div>
                <div className="text-sm text-muted-foreground">
                  Automatically send error reports to help us fix bugs
                </div>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-foreground transition-colors">
                <div className="absolute top-0.5 h-5 w-5 translate-x-5 rounded-full bg-background transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
            Cancel
          </button>
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
