"use client";

import { PromptingWorkflowStandalone } from "@/components/PromptingWorkflowStandalone";
import { GitIntegrationPanel } from "@/components/GitIntegrationPanel";

/**
 * Main page with PromptingWorkflowStandalone component.
 *
 * Unified workflow UI replacing the 4-section ClassicLayout grid.
 */
export default function Home() {
  return (
    <>
      <h1 className="text-2xl font-bold text-foreground mb-6">Scriptboard</h1>
      <PromptingWorkflowStandalone />
      <div className="mt-4">
        <GitIntegrationPanel />
      </div>
    </>
  );
}
