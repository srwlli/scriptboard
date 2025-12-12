"use client";

import { PromptingWorkflowStandalone } from "@/components/PromptingWorkflowStandalone";

/**
 * Main page with PromptingWorkflowStandalone component.
 *
 * Unified workflow UI replacing the 4-section ClassicLayout grid.
 */
export default function Home() {
  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 overflow-auto p-2">
        <PromptingWorkflowStandalone />
      </main>
    </div>
  );
}
