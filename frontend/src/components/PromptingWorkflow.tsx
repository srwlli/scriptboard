"use client";

import { PromptSection } from "@/components/ClassicLayout/PromptSection";
import { AttachmentsSection } from "@/components/ClassicLayout/AttachmentsSection";
import { ResponsesSection } from "@/components/ClassicLayout/ResponsesSection";
import { ManagementSection } from "@/components/ClassicLayout/ManagementSection";

/**
 * PromptingWorkflow component - combines all dashboard sections into one component.
 *
 * Contains:
 * - PromptSection (top-left)
 * - AttachmentsSection (top-right)
 * - ResponsesSection (bottom-left)
 * - ManagementSection (bottom-right)
 *
 * Responsive: 2 columns on md+, 1 column on mobile.
 */
export function PromptingWorkflow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <PromptSection />
      <AttachmentsSection />
      <ResponsesSection />
      <ManagementSection />
    </div>
  );
}
