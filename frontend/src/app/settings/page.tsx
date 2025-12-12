"use client";

import { useState } from "react";
import { ThemeSelector, ModeSwitcher, useTheme } from "@/components/theme";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { UpdateChecker } from "@/components/UpdateChecker";
import { CollapsibleCard } from "@/components/ui";

/**
 * Settings page containing application settings.
 * 
 * Features:
 * - Theme selection (modal with theme cards)
 * - Mode toggle (light/dark/system)
 * - Connection status monitoring
 * - Update checking
 * - Future settings can be added here
 */
export default function SettingsPage() {
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { theme, themes } = useTheme();

  // Get current theme name
  const currentTheme = themes.find((t) => t.id === theme);
  const themeName = currentTheme?.name || "Default";

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="space-y-4">
          {/* Connection Section */}
          <CollapsibleCard
            title="Connection"
            rightContent={<ConnectionStatus />}
          >
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Monitor the connection status to the Python backend server
              </p>
            </div>
          </CollapsibleCard>

          {/* Appearance Section */}
          <CollapsibleCard
            title="Appearance"
          >
            {/* Theme and Mode Selection - Combined */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Theme & Mode</p>
                <p className="text-sm text-muted-foreground">
                  Choose color palette and display mode
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="px-4 py-2 rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors"
                >
                  {themeName}
                </button>
                <ModeSwitcher />
              </div>
            </div>
          </CollapsibleCard>

          {/* Updates Section */}
          <CollapsibleCard
            title="Updates"
          >
            <UpdateChecker />
          </CollapsibleCard>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelector isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />
    </>
  );
}
