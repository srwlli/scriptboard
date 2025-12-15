"use client";

import { useState, useEffect, useCallback } from "react";
import {
  api,
  NetworkConnection,
  ListeningPort,
  NetworkConnectionsResponse,
  ListeningPortsResponse,
} from "@/lib/api";
import {
  RefreshCw,
  Wifi,
  Server,
  Pause,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

type TabView = "connections" | "listening";

export interface NetworkPanelProps {
  className?: string;
  pollInterval?: number;
  autoRefresh?: boolean;
}

/**
 * Network monitoring panel showing active connections and listening ports.
 * Features:
 * - Active connections table with process info
 * - Listening ports table
 * - Group by process option
 * - Auto-refresh with pause control
 */
export function NetworkPanel({
  className = "",
  pollInterval = 5000,
  autoRefresh = true,
}: NetworkPanelProps) {
  // Data state
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [listeningPorts, setListeningPorts] = useState<ListeningPort[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabView>("connections");
  const [isPaused, setIsPaused] = useState(false);
  const [groupByProcess, setGroupByProcess] = useState(false);
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set());

  // Fetch data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === "connections") {
        const data: NetworkConnectionsResponse = await api.getNetworkConnections();
        setConnections(data.connections);
      } else {
        const data: ListeningPortsResponse = await api.getListeningPorts();
        setListeningPorts(data.listening);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch network data");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh || isPaused) return;

    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, isPaused, pollInterval, fetchData]);

  // Group connections by process
  const groupedConnections = groupByProcess
    ? connections.reduce((acc, conn) => {
        const key = conn.process_name || `PID ${conn.pid}` || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(conn);
        return acc;
      }, {} as Record<string, NetworkConnection[]>)
    : null;

  // Group listening ports by process
  const groupedPorts = groupByProcess
    ? listeningPorts.reduce((acc, port) => {
        const key = port.process_name || `PID ${port.pid}` || "Unknown";
        if (!acc[key]) acc[key] = [];
        acc[key].push(port);
        return acc;
      }, {} as Record<string, ListeningPort[]>)
    : null;

  const toggleProcess = (processName: string) => {
    setExpandedProcesses((prev) => {
      const next = new Set(prev);
      if (next.has(processName)) {
        next.delete(processName);
      } else {
        next.add(processName);
      }
      return next;
    });
  };

  const formatAddress = (addr: string | null, port: number | null): string => {
    if (!addr && !port) return "-";
    if (addr === "0.0.0.0" || addr === "::") return `*:${port}`;
    return `${addr || "*"}:${port || ""}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case "ESTABLISHED":
        return "text-green-500";
      case "LISTEN":
        return "text-blue-500";
      case "TIME_WAIT":
        return "text-yellow-500";
      case "CLOSE_WAIT":
        return "text-orange-500";
      case "SYN_SENT":
      case "SYN_RECV":
        return "text-purple-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Network</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {activeTab === "connections" ? connections.length : listeningPorts.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Group toggle */}
          <button
            onClick={() => setGroupByProcess(!groupByProcess)}
            className={`p-1.5 rounded transition-colors text-xs ${
              groupByProcess ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            title="Group by process"
          >
            <Server size={14} />
          </button>
          {/* Pause/Resume */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded transition-colors ${
              isPaused ? "bg-yellow-500/20 text-yellow-600" : "hover:bg-muted"
            }`}
            title={isPaused ? "Resume auto-refresh" : "Pause auto-refresh"}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab("connections")}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            activeTab === "connections"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          onClick={() => setActiveTab("listening")}
          className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
            activeTab === "listening"
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          Listening ({listeningPorts.length})
        </button>
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

      {/* Content */}
      <div className="overflow-y-auto max-h-[300px] border border-border rounded-md">
        {activeTab === "connections" ? (
          groupByProcess && groupedConnections ? (
            // Grouped connections view
            <div className="divide-y divide-border">
              {Object.entries(groupedConnections)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([processName, conns]) => (
                  <div key={processName}>
                    <button
                      onClick={() => toggleProcess(processName)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 text-left"
                    >
                      {expandedProcesses.has(processName) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      <span className="font-medium text-sm">{processName}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">
                        {conns.length}
                      </span>
                    </button>
                    {expandedProcesses.has(processName) && (
                      <div className="pl-6 pb-2">
                        {conns.map((conn, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-4 py-1 text-xs"
                          >
                            <span className="w-20 text-muted-foreground">
                              {conn.type.toUpperCase()}/{conn.family}
                            </span>
                            <span className="w-32 font-mono">
                              {formatAddress(conn.local_addr, conn.local_port)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="w-32 font-mono">
                              {formatAddress(conn.remote_addr, conn.remote_port)}
                            </span>
                            <span className={getStatusColor(conn.status)}>
                              {conn.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            // Flat connections table
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Process</th>
                  <th className="text-left p-2 font-medium">Protocol</th>
                  <th className="text-left p-2 font-medium">Local</th>
                  <th className="text-left p-2 font-medium">Remote</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {connections.map((conn, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="p-2">
                      {conn.process_name || `PID ${conn.pid}` || "-"}
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {conn.type.toUpperCase()}/{conn.family}
                    </td>
                    <td className="p-2 font-mono">
                      {formatAddress(conn.local_addr, conn.local_port)}
                    </td>
                    <td className="p-2 font-mono">
                      {formatAddress(conn.remote_addr, conn.remote_port)}
                    </td>
                    <td className={`p-2 ${getStatusColor(conn.status)}`}>
                      {conn.status}
                    </td>
                  </tr>
                ))}
                {connections.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No active connections
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )
        ) : groupByProcess && groupedPorts ? (
          // Grouped listening ports view
          <div className="divide-y divide-border">
            {Object.entries(groupedPorts)
              .sort((a, b) => b[1].length - a[1].length)
              .map(([processName, ports]) => (
                <div key={processName}>
                  <button
                    onClick={() => toggleProcess(processName)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 text-left"
                  >
                    {expandedProcesses.has(processName) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                    <span className="font-medium text-sm">{processName}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded">
                      {ports.length}
                    </span>
                  </button>
                  {expandedProcesses.has(processName) && (
                    <div className="pl-6 pb-2">
                      {ports.map((port, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 py-1 text-xs"
                        >
                          <span className="w-20 text-muted-foreground">
                            {port.type.toUpperCase()}/{port.family}
                          </span>
                          <span className="font-mono text-blue-500">
                            {formatAddress(port.address, port.port)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          // Flat listening ports table
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">Process</th>
                <th className="text-left p-2 font-medium">Protocol</th>
                <th className="text-left p-2 font-medium">Address</th>
                <th className="text-left p-2 font-medium">Port</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listeningPorts.map((port, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="p-2">
                    {port.process_name || `PID ${port.pid}` || "-"}
                  </td>
                  <td className="p-2 text-muted-foreground">
                    {port.type.toUpperCase()}/{port.family}
                  </td>
                  <td className="p-2 font-mono">
                    {port.address === "0.0.0.0" || port.address === "::"
                      ? "*"
                      : port.address || "*"}
                  </td>
                  <td className="p-2 font-mono text-blue-500">{port.port}</td>
                </tr>
              ))}
              {listeningPorts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    No listening ports
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
