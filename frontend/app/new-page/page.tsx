"use client";

import { Header } from "@/components/Header";
import { FavoritesSection } from "@/components/ClassicLayout/FavoritesSection";
import { PromptSection } from "@/components/ClassicLayout/PromptSection";
import { AttachmentsSection } from "@/components/ClassicLayout/AttachmentsSection";
import { ResponsesSection } from "@/components/ClassicLayout/ResponsesSection";
import { ManagementSection } from "@/components/ClassicLayout/ManagementSection";
import { ToggleablePreview } from "@/components/ClassicLayout/ToggleablePreview";
import { FooterBar } from "@/components/ui";
import { useClassicLayout } from "@/hooks/useClassicLayout";

/**
 * New page replicating original scriptboard.py UI/UX with vertical stack layout.
 * 
 * Layout matches original:
 * - Favorites (horizontal button row)
 * - Prompt section (buttons + status)
 * - Attachments section (buttons + status)
 * - Responses section (buttons + status)
 * - Management section (buttons + status)
 * - Toggleable Preview (optional)
 * - Footer/Status bar (bottom)
 */
export default function NewPage() {
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
    <div className="min-h-screen bg-[#010409] classic-layout-container">
      <Header />
      <main className="flex flex-col">
        {/* Favorites Section */}
        <FavoritesSection />

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

        {/* Footer/Status Bar */}
        <FooterBar
          statusMessage={statusMessage}
          charCount={charCount}
          showSize={showSize}
          lockSize={lockSize}
          onTop={onTop}
          onLockSizeChange={setLockSize}
          onOnTopChange={setOnTop}
        />
      </main>
    </div>
  );
}

