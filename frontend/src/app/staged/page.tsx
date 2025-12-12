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
 * Staged page with grid-based design.
 *
 * Features:
 * - 3-column grid layout for panels
 * - Batch Queue, Git Integration, Logging Console
 * - Profile Selector, Keymap Editor
 * - User Feedback, Key Log panels
 */
export default function StagedPage() {
  // Enable keyboard shortcuts
  useScriptboardHotkeys();
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Staged</h1>
      <ProfileSelector />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <SessionManagerPanel />
        <BatchQueuePanel />
        <GitIntegrationPanel />
        <PreviewPanel />
        <UserFeedbackPanel />
        <KeyLogPanel />
        <KeymapEditor />
        <LoggingConsolePanel />
      </div>
    </>
  );
}
