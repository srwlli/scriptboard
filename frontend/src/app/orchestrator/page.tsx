"use client";

import { OrchestratorDashboard } from "@/components/orchestrator/OrchestratorDashboard";
import { useScriptboardHotkeys } from "@/lib/hotkeys";

/**
 * Orchestrator Dashboard page
 * Central hub for tracking projects, workorders, plans, and stubs
 */
export default function OrchestratorPage() {
  useScriptboardHotkeys();

  return <OrchestratorDashboard />;
}
