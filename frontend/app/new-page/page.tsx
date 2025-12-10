"use client";

import { Header } from "@/components/Header";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import { PromptPanel } from "@/components/PromptPanel";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";
import { ResponsesPanel } from "@/components/ResponsesPanel";
import { SessionManagerPanel } from "@/components/SessionManagerPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { BatchQueuePanel } from "@/components/BatchQueuePanel";
import { LoggingConsolePanel } from "@/components/LoggingConsolePanel";
import { ProfileSelector } from "@/components/ProfileSelector";
import { KeymapEditor } from "@/components/KeymapEditor";
import { GitIntegrationPanel } from "@/components/GitIntegrationPanel";
import { useScriptboardHotkeys } from "@/lib/hotkeys";

/**
 * Modern layout page with grid-based design.
 * 
 * Features:
 * - 3-column grid layout
 * - All Phase-2 features visible
 * - Batch Queue, Git Integration, Logging Console
 * - Profile Selector, Keymap Editor
 */
export default function ModernPage() {
  // Enable keyboard shortcuts
  useScriptboardHotkeys();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProfileSelector />
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <FavoritesPanel />
            <PromptPanel />
            <AttachmentsPanel />
          </div>

          {/* Middle Column */}
          <div className="space-y-4">
            <ResponsesPanel />
            <BatchQueuePanel />
            <GitIntegrationPanel />
            <SessionManagerPanel />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <PreviewPanel />
            <KeymapEditor />
            <LoggingConsolePanel />
          </div>
        </div>
      </main>
    </div>
  );
}
