"use client";

import { OrchestratorStats } from "@/lib/api";
import { FolderKanban, ClipboardList, FileText, Lightbulb, AlertTriangle } from "lucide-react";

interface OverviewTabProps {
  stats: OrchestratorStats | null;
  loading: boolean;
}

export function OverviewTab({ stats, loading }: OverviewTabProps) {
  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Projects"
          value={stats?.projects ?? 0}
          icon={<FolderKanban className="w-4 h-4" />}
        />
        <StatCard
          label="Active WOs"
          value={stats?.active_workorders ?? 0}
          icon={<ClipboardList className="w-4 h-4" />}
          highlight={stats?.active_workorders ? stats.active_workorders > 0 : false}
        />
        <StatCard
          label="Plans"
          value={stats?.plans ?? 0}
          icon={<FileText className="w-4 h-4" />}
        />
        <StatCard
          label="Stubs"
          value={stats?.stubs ?? 0}
          icon={<Lightbulb className="w-4 h-4" />}
        />
      </div>

      {/* Core Principle */}
      <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-amber-500 mb-1">Core Principle</div>
            <div className="text-xs text-muted-foreground">
              Do not execute work in other projects. Identify, delegate, collect.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          <QuickAction label="View Stale Plans" />
          <QuickAction label="Pending WOs" />
          <QuickAction label="New Stub" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`p-3 rounded border ${
      highlight ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-muted/30"
    }`}>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button className="px-2.5 py-1 text-xs border border-border rounded hover:bg-muted transition-colors">
      {label}
    </button>
  );
}
