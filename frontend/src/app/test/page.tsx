"use client";

import { PromptingWorkflowStandalone } from "@/components/PromptingWorkflowStandalone";

/**
 * Test page for experimenting with new layouts.
 * Uses the standalone component for trimming/customization.
 */
export default function TestPage() {
  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 overflow-auto p-2">
        <PromptingWorkflowStandalone />
      </main>
    </div>
  );
}
