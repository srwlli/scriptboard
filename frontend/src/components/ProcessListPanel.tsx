"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ProcessInfo } from "@/lib/api";
import { useConfirmModal } from "@/components/ui/ConfirmModal";
import { RefreshCw, Search, ChevronUp, ChevronDown, Skull, Shield } from "lucide-react";

type SortField = "name" | "pid" | "cpu_percent" | "memory_percent" | "memory_mb";
type SortOrder = "asc" | "desc";

export function ProcessListPanel() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortField>("cpu_percent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterName, setFilterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [ConfirmModalComponent, confirm] = useConfirmModal();

  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getProcesses({
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        filter_name: filterName || undefined,
      });
      setProcesses(data.processes);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch processes");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sortBy, sortOrder, filterName]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleKillProcess = async (proc: ProcessInfo) => {
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
      // Refresh list after kill
      await fetchProcesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to kill process");
    } finally {
      setKillingPid(null);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      {ConfirmModalComponent}

      {/* Controls and Search filter */}
      <div className="mb-3 flex gap-2">
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
        <button
          onClick={() => fetchProcesses()}
          disabled={isLoading}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 border border-border rounded-md"
          title="Refresh"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      {statusMessage && <p className="text-sm text-green-500 mb-2">{statusMessage}</p>}

      {/* Process table */}
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr>
              <th
                className="text-left p-1.5 cursor-pointer hover:bg-muted"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name <SortIcon field="name" />
                </div>
              </th>
              <th
                className="text-right p-1.5 cursor-pointer hover:bg-muted"
                onClick={() => handleSort("pid")}
              >
                <div className="flex items-center justify-end gap-1">
                  PID <SortIcon field="pid" />
                </div>
              </th>
              <th
                className="text-right p-1.5 cursor-pointer hover:bg-muted"
                onClick={() => handleSort("cpu_percent")}
              >
                <div className="flex items-center justify-end gap-1">
                  CPU% <SortIcon field="cpu_percent" />
                </div>
              </th>
              <th
                className="text-right p-1.5 cursor-pointer hover:bg-muted"
                onClick={() => handleSort("memory_mb")}
              >
                <div className="flex items-center justify-end gap-1">
                  Mem(MB) <SortIcon field="memory_mb" />
                </div>
              </th>
              <th className="text-center p-1.5 w-12">Kill</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc) => (
              <tr
                key={proc.pid}
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <td className="p-1.5">
                  <div className="flex items-center gap-1">
                    {proc.is_protected && (
                      <span title="Protected">
                        <Shield size={12} className="text-yellow-500 shrink-0" />
                      </span>
                    )}
                    <span className="truncate max-w-[150px]" title={proc.name}>
                      {proc.name}
                    </span>
                  </div>
                </td>
                <td className="text-right p-1.5 text-muted-foreground">{proc.pid}</td>
                <td className="text-right p-1.5">
                  <span className={proc.cpu_percent > 50 ? "text-red-500" : ""}>
                    {proc.cpu_percent.toFixed(1)}
                  </span>
                </td>
                <td className="text-right p-1.5">{proc.memory_mb.toFixed(1)}</td>
                <td className="text-center p-1.5">
                  <button
                    onClick={() => handleKillProcess(proc)}
                    disabled={killingPid === proc.pid}
                    className={`p-1 rounded transition-colors ${
                      proc.is_protected
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-red-500 hover:bg-red-500/10"
                    } disabled:opacity-50`}
                    title={proc.is_protected ? "Protected process" : "Kill process"}
                  >
                    <Skull size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
