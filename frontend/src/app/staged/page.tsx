"use client";

import { SessionManagerPanel } from "@/components/SessionManagerPanel";
import { LoggingConsolePanel } from "@/components/LoggingConsolePanel";
import { ProfileSelector } from "@/components/ProfileSelector";
import { KeyLogPanel } from "@/components/KeyLogPanel";
import { SystemMonitor } from "@/components/SystemMonitor";
import { FileManager } from "@/components/FileManager";
import { useScriptboardHotkeys } from "@/lib/hotkeys";

/**
 * Staged page with utility panels.
 *
 * Features:
 * - System monitoring (CPU, memory, processes)
 * - File management (organize, rename, clean, dupes)
 * - Session management (save/load/export)
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
      <div className="space-y-4 mt-4">
        <SystemMonitor />
        <FileManager />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SessionManagerPanel />
          <KeyLogPanel />
          <LoggingConsolePanel />
        </div>
      </div>
    </>
  );
}
