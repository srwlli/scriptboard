"use client";

import { Header } from "@/components/Header";
import { PromptSection } from "@/components/ClassicLayout/PromptSection";
import { AttachmentsSection } from "@/components/ClassicLayout/AttachmentsSection";
import { ResponsesSection } from "@/components/ClassicLayout/ResponsesSection";
import { ManagementSection } from "@/components/ClassicLayout/ManagementSection";
import { ToggleablePreview } from "@/components/ClassicLayout/ToggleablePreview";
import { FooterBar } from "@/components/ui";
import { useClassicLayout } from "@/hooks/useClassicLayout";

/**
 * Main page with classic layout replicating original scriptboard.py UI/UX.
 * 
 * Layout matches original:
 * - Favorites button (moved to header, top right)
 * - Prompt section (buttons + status)
 * - Attachments section (buttons + status)
 * - Responses section (buttons + status)
 * - Management section (buttons + status)
 * - Toggleable Preview (optional)
 * - Footer/Status bar (bottom)
 */
export default function Home() {
  const {
    previewVisible,
    togglePreview,
    statusMessage,
    showSize,
    lockSize,
    setLockSize,
    onTop,
    setOnTop,
    charCount,
  } = useClassicLayout();

  return (
    <div className="min-h-screen bg-background classic-layout-container flex flex-col">
      <Header />
      <main className="flex flex-col flex-1">
        {/* Prompt Section */}
        <PromptSection />

        {/* Attachments Section */}
        <AttachmentsSection />

        {/* Responses Section */}
        <ResponsesSection />

        {/* Management Section */}
        <ManagementSection />

        {/* Toggleable Preview */}
        <ToggleablePreview visible={previewVisible} onToggle={togglePreview} />

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />
      </main>
      
      {/* Footer/Status Bar - Always at bottom */}
      <FooterBar
        statusMessage={statusMessage}
        charCount={charCount}
        showSize={showSize}
        lockSize={lockSize}
        onTop={onTop}
        onLockSizeChange={setLockSize}
        onOnTopChange={setOnTop}
      />
    </div>
  );
}
