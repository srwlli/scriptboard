"use client";

import { useState, useEffect, useRef } from "react";
import { api, OrchestratorStats } from "@/lib/api";
import { RefreshCw, WifiOff, Wifi, WifiLow } from "lucide-react";
import { OrchestratorTabs } from "./OrchestratorTabs";
import { OverviewTab } from "./OverviewTab";
import { ProjectsTab } from "./ProjectsTab";
import { StubsTab } from "./StubsTab";
import { WorkordersTab } from "./WorkordersTab";
import { PlansTab } from "./PlansTab";
import { LogTab } from "./LogTab";
import { useOrchestratorWebSocket } from "@/hooks/useOrchestratorWebSocket";
import { toast } from "sonner";

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

  const plansTabRef = useRef<{ reload: () => void } | null>(null);
  const stubsTabRef = useRef<{ reload: () => void } | null>(null);
  const workordersTabRef = useRef<{ reload: () => void } | null>(null);
  const projectsTabRef = useRef<{ reload: () => void } | null>(null);
  const prevStatusRef = useRef<string>('disconnected');

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

  // WebSocket integration
  const { status, connected } = useOrchestratorWebSocket({
    onPlanAdded: () => { loadStats(); plansTabRef.current?.reload(); },
    onPlanUpdated: () => { loadStats(); plansTabRef.current?.reload(); },
    onPlanDeleted: () => { loadStats(); plansTabRef.current?.reload(); },
    onStubAdded: () => { loadStats(); stubsTabRef.current?.reload(); },
    onStubUpdated: () => { loadStats(); stubsTabRef.current?.reload(); },
    onStubDeleted: () => { loadStats(); stubsTabRef.current?.reload(); },
    onWorkorderAdded: () => { loadStats(); workordersTabRef.current?.reload(); },
    onProjectAdded: () => { loadStats(); projectsTabRef.current?.reload(); },
    onProjectRemoved: () => { loadStats(); projectsTabRef.current?.reload(); },
  });

  // Toast notifications on connection status change
  useEffect(() => {
    if (prevStatusRef.current === 'connected' && status === 'disconnected') {
      toast.error('Real-time updates disconnected');
    } else if (prevStatusRef.current === 'disconnected' && status === 'connected') {
      toast.success('Real-time updates connected');
    }
    prevStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Orchestrator</h1>

          {/* WebSocket connection status */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: status === 'connected' ? 'rgba(34, 197, 94, 0.2)' :
                              status === 'connecting' ? 'rgba(251, 191, 36, 0.2)' :
                              'rgba(239, 68, 68, 0.2)',
              color: status === 'connected' ? 'rgb(34, 197, 94)' :
                     status === 'connecting' ? 'rgb(251, 191, 36)' :
                     'rgb(239, 68, 68)'
            }}
            title={status === 'connected' ? 'Live updates enabled' :
                   status === 'connecting' ? 'Connecting...' :
                   'Disconnected - manual refresh only'}
          >
            {status === 'connected' && <Wifi className="w-3 h-3" />}
            {status === 'connecting' && <WifiLow className="w-3 h-3" />}
            {status === 'disconnected' && <WifiOff className="w-3 h-3" />}
            <span>{status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}</span>
          </div>

          {dataSource === "gist" && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded text-xs" title={gistTimestamp ? "Last synced: " + new Date(gistTimestamp).toLocaleString() : "Offline mode"}>
              <WifiOff className="w-3 h-3" />
              <span>Gist Mode</span>
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
