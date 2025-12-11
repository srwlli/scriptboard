"use client";

import { SessionManagerPanel } from "@/components/SessionManagerPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { BatchQueuePanel } from "@/components/BatchQueuePanel";
import { LoggingConsolePanel } from "@/components/LoggingConsolePanel";
import { ProfileSelector } from "@/components/ProfileSelector";
import { KeymapEditor } from "@/components/KeymapEditor";
import { GitIntegrationPanel } from "@/components/GitIntegrationPanel";
import { KeyLogPanel } from "@/components/KeyLogPanel";
import { UserFeedbackPanel } from "@/components/UserFeedbackPanel";
import { useScriptboardHotkeys } from "@/lib/hotkeys";

/**
 * View Components page with grid-based design.
 *
 * Features:
 * - 3-column grid layout for panels
 * - Batch Queue, Git Integration, Logging Console
 * - Profile Selector, Keymap Editor
 * - User Feedback, Key Log panels
 */
export default function ModernPage() {
  // Enable keyboard shortcuts
  useScriptboardHotkeys();
  return (
    <div className="h-full bg-background">
      <ProfileSelector />

      {/* Panels - Grid layout */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <SessionManagerPanel />
            <BatchQueuePanel />
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <GitIntegrationPanel />
            <PreviewPanel />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <UserFeedbackPanel />
            <KeyLogPanel />
            <KeymapEditor />
            <LoggingConsolePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
