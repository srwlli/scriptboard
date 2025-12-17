"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorStats } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import { OrchestratorTabs } from "./OrchestratorTabs";
import { OverviewTab } from "./OverviewTab";
import { ProjectsTab } from "./ProjectsTab";
import { StubsTab } from "./StubsTab";

type TabId = "overview" | "projects" | "workorders" | "plans" | "stubs";

/**
 * Orchestrator Dashboard - Central hub for tracking projects, workorders, plans, stubs
 * WO-ORCHESTRATOR-DASHBOARD-001
 */
export function OrchestratorDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Orchestrator</h1>
        <button
          onClick={loadStats}
          disabled={loading}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-400 mb-2">{error}</div>
      )}

      {/* Tabs */}
      <OrchestratorTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stats={stats}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto mt-4">
        {activeTab === "overview" && <OverviewTab stats={stats} loading={loading} />}
        {activeTab === "projects" && <ProjectsTab />}
        {activeTab === "stubs" && <StubsTab />}
        {activeTab === "workorders" && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Workorders tab coming in Phase 3
          </div>
        )}
        {activeTab === "plans" && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Plans tab coming in Phase 3
          </div>
        )}
      </div>
    </div>
  );
}
