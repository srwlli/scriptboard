"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  FolderSearch,
  LayoutDashboard,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  RefreshCw
} from "lucide-react";
import { ScanResults, ScanResultsData } from "./coderef/ScanResults";
import { QueryInterface, QueryResultsData } from "./coderef/QueryInterface";
import { DashboardViewer, DashboardData } from "./coderef/DashboardViewer";

type TabId = "scan" | "query" | "dashboard";

const LANGUAGES = [
  { value: "ts,tsx", label: "TypeScript" },
  { value: "js,jsx", label: "JavaScript" },
  { value: "py", label: "Python" },
  { value: "ts,tsx,js,jsx", label: "All JS/TS" },
];

interface CodeRefStatus {
  available: boolean;
  cli_path: string;
  message: string;
}

export function CodeRefPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("scan");
  const [status, setStatus] = useState<CodeRefStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Scan state
  const [sourceDir, setSourceDir] = useState("");
  const [languages, setLanguages] = useState("ts,tsx");
  const [useAst, setUseAst] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResultsData | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Query state
  const [queryResults, setQueryResults] = useState<QueryResultsData | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const API_BASE = "http://localhost:8042";

  // Check CLI status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coderef/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setStatus({
        available: false,
        cli_path: "",
        message: "Failed to connect to backend"
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleScan = async () => {
    if (!sourceDir.trim()) {
      setScanError("Please enter a directory path");
      return;
    }

    setScanLoading(true);
    setScanError(null);
    setScanResults(null);

    try {
      const res = await fetch(`${API_BASE}/coderef/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_dir: sourceDir,
          languages: languages.split(","),
          use_ast: useAst
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Scan failed");
      }

      const data = await res.json();
      setScanResults(data);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanLoading(false);
    }
  };

  const handleQuery = async (target: string) => {
    setQueryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coderef/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          source_dir: sourceDir || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Query failed");
      }

      const data = await res.json();
      setQueryResults(data);
    } catch (err) {
      console.error("Query error:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleGenerateDashboard = async () => {
    if (!sourceDir.trim()) return;

    setDashboardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coderef/dashboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_dir: sourceDir,
          languages: languages.split(",")
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Dashboard generation failed");
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const tabs = [
    { id: "scan" as TabId, label: "Scan", icon: FolderSearch },
    { id: "query" as TabId, label: "Query", icon: Search },
    { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">CodeRef</h2>
        </div>
        <div className="flex items-center gap-2">
          {statusLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : status?.available ? (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>CLI Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <XCircle className="w-3.5 h-3.5" />
              <span>CLI Not Found</span>
            </div>
          )}
        </div>
      </div>

      {/* Directory Input */}
      <div className="mb-4 space-y-2">
        <label className="text-xs text-muted-foreground">Source Directory</label>
        <input
          type="text"
          value={sourceDir}
          onChange={(e) => setSourceDir(e.target.value)}
          placeholder="C:/path/to/project"
          className="w-full px-3 py-2 bg-muted border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Options Row */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Language:</label>
          <select
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            className="px-2 py-1 bg-muted border border-border rounded text-xs"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={useAst}
            onChange={(e) => setUseAst(e.target.checked)}
            className="rounded"
          />
          <span>AST Mode (more accurate)</span>
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "scan" && (
          <div className="space-y-4">
            <button
              onClick={handleScan}
              disabled={scanLoading || !sourceDir.trim() || !status?.available}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scanLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Scan
                </>
              )}
            </button>

            {scanError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded text-sm">
                <AlertTriangle className="w-4 h-4" />
                {scanError}
              </div>
            )}

            <ScanResults data={scanResults} loading={scanLoading} />
          </div>
        )}

        {activeTab === "query" && (
          <QueryInterface
            onQuery={handleQuery}
            results={queryResults}
            loading={queryLoading}
          />
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <button
              onClick={handleGenerateDashboard}
              disabled={dashboardLoading || !sourceDir.trim() || !status?.available}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dashboardLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  Generate Dashboard
                </>
              )}
            </button>

            <DashboardViewer
              data={dashboardData}
              baseUrl={API_BASE}
              onClose={() => setDashboardData(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
