"use client";

import { Header } from "@/components/Header";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Settings page containing application settings.
 * 
 * Features:
 * - Theme toggle (dark/light mode)
 * - Future settings can be added here
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
          
          <div className="space-y-6">
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

