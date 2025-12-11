"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { ConnectionStatus } from "@/components/ConnectionStatus";

/**
 * Settings page containing application settings.
 * 
 * Features:
 * - Theme toggle (dark/light mode)
 * - Future settings can be added here
 */
export default function SettingsPage() {
  return (
    <div className="h-full bg-background">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* Connection Section */}
            <section className="border border-border rounded-lg p-6 bg-background">
              <h2 className="text-lg font-semibold text-foreground mb-4">Connection</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Backend Status</p>
                  <p className="text-sm text-muted-foreground">
                    Connection to the Python backend server
                  </p>
                </div>
                <ConnectionStatus />
              </div>
            </section>

            {/* Theme Section */}
            <section className="border border-border rounded-lg p-6 bg-background">
              <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

