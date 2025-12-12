"use client";

import { useState } from "react";
import { ThemeSelector, ModeSwitcher, useTheme } from "@/components/theme";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { UpdateChecker } from "@/components/UpdateChecker";

/**
 * Settings page containing application settings.
 * 
 * Features:
 * - Theme selection (modal with theme cards)
 * - Mode toggle (light/dark/system)
 * - Future settings can be added here
 */
export default function SettingsPage() {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { theme, themes } = useTheme();

  // Get current theme name
  const currentTheme = themes.find((t) => t.id === theme);
  const themeName = currentTheme?.name || "Default";

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

            {/* Appearance Section */}
            <section className="border border-border rounded-lg p-6 bg-background">
              <h2 className="text-lg font-semibold text-foreground mb-4">Appearance</h2>

              {/* Theme Selection */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a color palette
                  </p>
                </div>
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors"
                >
                  {themeName}
                </button>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Choose light, dark, or system preference
                  </p>
                </div>
                <ModeSwitcher />
              </div>
            </section>

            {/* Updates Section */}
            <section className="border border-border rounded-lg p-6 bg-background">
              <h2 className="text-lg font-semibold text-foreground mb-4">Updates</h2>
              <UpdateChecker />
            </section>
          </div>
        </div>
      </main>

      {/* Theme Selector Modal */}
      <ThemeSelector isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
    </div>
  );
}
