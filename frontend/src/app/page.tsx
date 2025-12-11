"use client";

import { PromptSection } from "@/components/ClassicLayout/PromptSection";
import { AttachmentsSection } from "@/components/ClassicLayout/AttachmentsSection";
import { ResponsesSection } from "@/components/ClassicLayout/ResponsesSection";
import { ManagementSection } from "@/components/ClassicLayout/ManagementSection";
import { ToggleablePreview } from "@/components/ClassicLayout/ToggleablePreview";
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
  const { previewVisible, togglePreview } = useClassicLayout();

  return (
    <div className="h-full bg-background classic-layout-container flex flex-col">
      <main className="flex-1 overflow-auto p-2">
        {/* 2-column grid for section cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <PromptSection />
          <AttachmentsSection />
          <ResponsesSection />
          <ManagementSection />
        </div>

        {/* Toggleable Preview */}
        <ToggleablePreview visible={previewVisible} onToggle={togglePreview} />
      </main>
    </div>
  );
}
