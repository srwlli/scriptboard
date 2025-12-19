"use client";

import { useState, useEffect } from "react";
import { api, OrchestratorStats } from "@/lib/api";
import { RefreshCw, WifiOff } from "lucide-react";
import { OrchestratorTabs } from "./OrchestratorTabs";
import { OverviewTab } from "./OverviewTab";
import { ProjectsTab } from "./ProjectsTab";
import { StubsTab } from "./StubsTab";
import { WorkordersTab } from "./WorkordersTab";
import { PlansTab } from "./PlansTab";
import { LogTab } from "./LogTab";

type TabId = "overview" | "projects" | "workorders" | "plans" | "stubs" | "log";

/**
 * Orchestrator Dashboard - Central hub for tracking projects, workorders, plans, stubs
 * WO-ORCHESTRATOR-DASHBOARD-001
 */
export function OrchestratorDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "gist">("live");
  const [gistTimestamp, setGistTimestamp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrchestratorStats();
      setStats(data);
      // Check if data came from gist fallback
      if ((data as any)._source === "gist") {
        setDataSource("gist");
        setGistTimestamp((data as any)._timestamp || null);
      } else {
        setDataSource("live");
        setGistTimestamp(null);
      }
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
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Orchestrator</h1>
          {dataSource === "gist" && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs" title={gistTimestamp ? "Last synced: " + new Date(gistTimestamp).toLocaleString() : "Offline mode"}>
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
        </div>
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
        {activeTab === "workorders" && <WorkordersTab />}
        {activeTab === "plans" && <PlansTab />}
        {activeTab === "log" && <LogTab />}
      </div>
    </div>
  );
}
