"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { api, DetailedProcessInfo, ProcessCategory } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { QuickFilters, QuickFilter } from "./QuickFilters";
import { ProcessRow } from "./ProcessRow";
import { ProcessGroup, CATEGORY_NAMES } from "./ProcessGroup";
import {
  RefreshCw,
  Search,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Pause,
  Play,
} from "lucide-react";

type SortField = "name" | "pid" | "cpu_percent" | "memory_mb" | "start_time" | "category";
type SortOrder = "asc" | "desc";
type ViewMode = "list" | "grouped";

// Category icons (matching backend)
const CATEGORY_ICONS: Record<ProcessCategory, string> = {
  browser: "🌐",
  dev: "🛠️",
  system: "⚙️",
  app: "📱",
  media: "🎬",
  communication: "💬",
  security: "🛡️",
  other: "❓",
};

export interface ProcessListV2Props {
  className?: string;
  pageSize?: number;
  pollInterval?: number;
  autoRefresh?: boolean;
}

/**
 * Enhanced process list with categories, expandable details, quick filters,
 * resource history sparklines, and grouping options.
 */
export function ProcessListV2({
  className = "",
  pageSize = 50,
  pollInterval = 10000,
  autoRefresh = true,
}: ProcessListV2Props) {
  // Data state
  const [processes, setProcesses] = useState<DetailedProcessInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [networkPids, setNetworkPids] = useState<Set<number>>(new Set());
  const [startupExes, setStartupExes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("cpu_percent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterName, setFilterName] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showSystem, setShowSystem] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedPids, setExpandedPids] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<ProcessCategory>>(
    new Set<ProcessCategory>(["browser", "dev", "app", "media", "communication"])
  );

  // Kill process state
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  // Ref to pause polling when modal is open
  const isModalOpenRef = useRef(false);

  // Fetch processes, network PIDs, and startup apps
  const fetchProcesses = useCallback(async () => {
    // Skip polling while modal is open to prevent re-render issues
    if (isModalOpenRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch processes, network PIDs, and startup apps in parallel
      const [processData, networkData, startupData] = await Promise.all([
        api.getDetailedProcesses({
          page,
          page_size: pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          filter_name: filterName || undefined,
          // No filter_category - fetch all, filter client-side for instant switching
          include_system: showSystem,
        }),
        api.getPidsWithConnections(),
        api.getStartupApps(),
      ]);

      setProcesses(processData.processes);
      setTotalCount(processData.total_count);
      setCategories(processData.categories);
      setNetworkPids(new Set(networkData.pids));
      // Build set of startup executable names (lowercase, no .exe)
      setStartupExes(new Set(startupData.apps.map(app => app.executable.toLowerCase())));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch processes");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filterName, showSystem]);

  // Initial fetch and polling
  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  useEffect(() => {
    if (!autoRefresh || isPaused) return;

    const interval = setInterval(fetchProcesses, pollInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, isPaused, pollInterval, fetchProcesses]);

  // Client-side filtering for instant filter switching (no API call)
  const filteredProcesses = useMemo(() => {
    let result = processes;

    // Category filters
    const categoryMap: Record<QuickFilter, string | null> = {
      all: null,
      apps: "app",
      browsers: "browser",
      dev: "dev",
      system: "system",
      media: "media",
      communication: "communication",
      security: "security",
      high_cpu: null,
      high_memory: null,
      network: null,
      safe_to_kill: null,
      startup: null,
      recent: null,
    };

    const category = categoryMap[quickFilter];
    if (category) {
      result = result.filter((p) => p.category === category);
    }

    // Special filters
    if (quickFilter === "high_cpu") {
      result = result.filter((p) => p.cpu_percent > 10);
    } else if (quickFilter === "high_memory") {
      // >500MB or >5% memory usage
      result = result.filter((p) => p.memory_mb > 500 || p.memory_percent > 5);
    } else if (quickFilter === "network") {
      // Processes with active network connections
      result = result.filter((p) => networkPids.has(p.pid));
    } else if (quickFilter === "safe_to_kill") {
      // Safe processes (score >= 70)
      result = result.filter((p) => (p.safe_to_kill_score ?? 50) >= 70);
    } else if (quickFilter === "startup") {
      // Processes that are startup apps
      result = result.filter((p) => {
        const procName = p.name.toLowerCase().replace('.exe', '');
        return startupExes.has(procName);
      });
    } else if (quickFilter === "recent") {
      result = result.filter((p) => p.is_new);
    }

    return result;
  }, [processes, quickFilter, networkPids, startupExes]);

  // Group by category
  const groupedProcesses = useMemo(() => {
    if (viewMode !== "grouped") return null;

    const groups = new Map<ProcessCategory, DetailedProcessInfo[]>();
    for (const proc of filteredProcesses) {
      const cat = proc.category as ProcessCategory;
      if (!groups.has(cat)) {
        groups.set(cat, []);
      }
      groups.get(cat)!.push(proc);
    }

    // Sort categories by count
    return Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filteredProcesses, viewMode]);

  // Compute quick filter counts
  const filterCounts = useMemo(() => {
    return {
      all: totalCount,
      apps: categories["app"] || 0,
      browsers: categories["browser"] || 0,
      dev: categories["dev"] || 0,
      system: categories["system"] || 0,
      media: categories["media"] || 0,
      communication: categories["communication"] || 0,
      security: categories["security"] || 0,
      high_cpu: processes.filter((p) => p.cpu_percent > 10).length,
      high_memory: processes.filter((p) => p.memory_mb > 500 || p.memory_percent > 5).length,
      network: processes.filter((p) => networkPids.has(p.pid)).length,
      safe_to_kill: processes.filter((p) => (p.safe_to_kill_score ?? 50) >= 70).length,
      startup: processes.filter((p) => {
        const procName = p.name.toLowerCase().replace('.exe', '');
        return startupExes.has(procName);
      }).length,
      recent: processes.filter((p) => p.is_new).length,
    };
  }, [totalCount, categories, processes, networkPids, startupExes]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleToggleExpand = (pid: number) => {
    setExpandedPids((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const handleToggleCategoryExpand = (category: ProcessCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleKillProcess = async (proc: DetailedProcessInfo) => {
    // Pause polling while modal is open
    isModalOpenRef.current = true;

    try {
      if (proc.is_protected) {
        await confirm({
          title: "Protected Process",
          message: `${proc.name} is a protected system process and cannot be killed.`,
          confirmText: "OK",
          cancelText: "Cancel",
          danger: false,
        });
        return;
      }

      const confirmed = await confirm({
        title: "Kill Process?",
        message: `Are you sure you want to terminate "${proc.name}" (PID: ${proc.pid})? This action cannot be undone.`,
        confirmText: "Kill Process",
        cancelText: "Cancel",
        danger: true,
      });

      if (!confirmed) return;

      setKillingPid(proc.pid);
      try {
        const result = await api.killProcess(proc.pid);
        setStatusMessage(result.message);
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to kill process");
      } finally {
        setKillingPid(null);
      }
    } finally {
      // Resume polling after modal closes
      isModalOpenRef.current = false;
      // Refresh after action
      fetchProcesses();
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={className}>
      {ConfirmModalComponent}

      {/* Header with process count */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Processes</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grouped" : "list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grouped" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            title={viewMode === "list" ? "Group by category" : "List view"}
          >
            {viewMode === "list" ? <LayoutGrid size={14} /> : <List size={14} />}
          </button>
          {/* Show system toggle */}
          <button
            onClick={() => setShowSystem(!showSystem)}
            className={`p-1.5 rounded transition-colors ${
              showSystem ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
            title={showSystem ? "Hide system processes" : "Show system processes"}
          >
            {showSystem ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {/* Pause/Resume polling */}
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
            onClick={() => fetchProcesses()}
            disabled={isLoading}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 rounded hover:bg-muted"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Quick filters - instant client-side filtering */}
      <QuickFilters
        active={quickFilter}
        onChange={setQuickFilter}
        counts={filterCounts}
        className="mb-3"
      />

      {/* Search and sort */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filterName}
            onChange={(e) => {
              setFilterName(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by name..."
            className="w-full pl-7 pr-2 py-1.5 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => handleSort(e.target.value as SortField)}
          className="px-2 py-1.5 text-sm border border-border rounded-md bg-background"
        >
          <option value="cpu_percent">CPU</option>
          <option value="memory_mb">Memory</option>
          <option value="name">Name</option>
          <option value="start_time">Start Time</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Error / Status messages */}
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {statusMessage && <p className="text-sm text-green-500 mb-2">{statusMessage}</p>}

      {/* Process list */}
      <div className="overflow-y-auto max-h-[500px] border border-border rounded-md">
        {viewMode === "grouped" && groupedProcesses ? (
          // Grouped view
          <div className="space-y-2 p-2">
            {groupedProcesses.map(([category, procs]) => (
              <ProcessGroup
                key={category}
                category={category}
                categoryName={CATEGORY_NAMES[category]}
                icon={CATEGORY_ICONS[category]}
                count={procs.length}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => handleToggleCategoryExpand(category)}
              >
                {procs.map((proc) => (
                  <ProcessRow
                    key={proc.pid}
                    process={proc}
                    isExpanded={expandedPids.has(proc.pid)}
                    onToggle={() => handleToggleExpand(proc.pid)}
                    onKill={() => handleKillProcess(proc)}
                    isKilling={killingPid === proc.pid}
                  />
                ))}
              </ProcessGroup>
            ))}
          </div>
        ) : (
          // List view
          <div>
            {/* Header row */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 border-b border-border text-xs font-medium sticky top-0 z-10">
              <div className="w-5" /> {/* Expand icon space */}
              <div className="w-6" /> {/* Category icon space */}
              <div
                className="flex-1 cursor-pointer hover:text-primary flex items-center gap-1"
                onClick={() => handleSort("name")}
              >
                Name <SortIcon field="name" />
              </div>
              <div
                className="w-24 text-right cursor-pointer hover:text-primary flex items-center justify-end gap-1"
                onClick={() => handleSort("cpu_percent")}
              >
                CPU <SortIcon field="cpu_percent" />
              </div>
              <div
                className="w-28 text-right cursor-pointer hover:text-primary flex items-center justify-end gap-1"
                onClick={() => handleSort("memory_mb")}
              >
                Memory <SortIcon field="memory_mb" />
              </div>
              <div className="w-8" /> {/* Kill button space */}
            </div>
            {/* Process rows */}
            {filteredProcesses.map((proc) => (
              <ProcessRow
                key={proc.pid}
                process={proc}
                isExpanded={expandedPids.has(proc.pid)}
                onToggle={() => handleToggleExpand(proc.pid)}
                onKill={() => handleKillProcess(proc)}
                isKilling={killingPid === proc.pid}
              />
            ))}
            {filteredProcesses.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No processes found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {totalCount > 0
            ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount}`
            : "No processes"}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 border border-border rounded disabled:opacity-50 hover:bg-muted"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 border border-border rounded disabled:opacity-50 hover:bg-muted"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
