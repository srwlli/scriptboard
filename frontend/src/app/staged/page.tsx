"use client";

import { SessionManagerPanel } from "@/components/SessionManagerPanel";
import { LoggingConsolePanel } from "@/components/LoggingConsolePanel";
import { ProfileSelector } from "@/components/ProfileSelector";
import { GitIntegrationPanel } from "@/components/GitIntegrationPanel";
import { KeyLogPanel } from "@/components/KeyLogPanel";
import { useScriptboardHotkeys } from "@/lib/hotkeys";

/**
 * Staged page with utility panels.
 *
 * Features:
 * - Session management (save/load/export)
 * - Git integration
 * - Macro recording (Key Logger)
 * - Debug console
 */
export default function StagedPage() {
  // Enable keyboard shortcuts
  useScriptboardHotkeys();
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Staged</h1>
      <ProfileSelector />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <SessionManagerPanel />
        <GitIntegrationPanel />
        <KeyLogPanel />
        <LoggingConsolePanel />
      </div>
    </>
  );
}
