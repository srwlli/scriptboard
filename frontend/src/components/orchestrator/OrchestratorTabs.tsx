"use client";

import { OrchestratorStats } from "@/lib/api";
import { LayoutDashboard, FolderKanban, FileText, ClipboardList, Lightbulb, ScrollText } from "lucide-react";

type TabId = "overview" | "projects" | "workorders" | "plans" | "stubs" | "log";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

interface OrchestratorTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  stats: OrchestratorStats | null;
}

export function OrchestratorTabs({ activeTab, onTabChange, stats }: OrchestratorTabsProps) {
  const tabs: Tab[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: "projects", label: "Projects", icon: <FolderKanban className="w-3.5 h-3.5" />, count: stats?.projects },
    { id: "workorders", label: "WOs", icon: <ClipboardList className="w-3.5 h-3.5" />, count: stats?.active_workorders },
    { id: "plans", label: "Plans", icon: <FileText className="w-3.5 h-3.5" />, count: stats?.plans },
    { id: "stubs", label: "Stubs", icon: <Lightbulb className="w-3.5 h-3.5" />, count: stats?.stubs },
    { id: "log", label: "Log", icon: <ScrollText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex gap-1 border-b border-border pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-t transition-colors ${
            activeTab === tab.id
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeTab === tab.id ? "bg-background" : "bg-muted"
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
