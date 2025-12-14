"use client";

import { useState } from "react";
import { CollapsibleCard } from "@/components/ui";
import { OrganizePanel } from "./filemanager/OrganizePanel";
import { RenamePanel } from "./filemanager/RenamePanel";
import { CleanPanel } from "./filemanager/CleanPanel";
import { IndexPanel } from "./filemanager/IndexPanel";
import { DupesPanel } from "./filemanager/DupesPanel";
import { UndoPanel } from "./filemanager/UndoPanel";
import {
  FolderTree,
  TextCursorInput,
  Trash2,
  FileSearch,
  Copy,
  Undo2,
} from "lucide-react";

type Tab = "organize" | "rename" | "clean" | "index" | "dupes" | "undo";

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  { id: "organize", label: "Organize", icon: <FolderTree size={14} /> },
  { id: "rename", label: "Rename", icon: <TextCursorInput size={14} /> },
  { id: "clean", label: "Clean", icon: <Trash2 size={14} /> },
  { id: "index", label: "Index", icon: <FileSearch size={14} /> },
  { id: "dupes", label: "Dupes", icon: <Copy size={14} /> },
  { id: "undo", label: "Undo", icon: <Undo2 size={14} /> },
];

interface FileManagerProps {
  defaultCollapsed?: boolean;
}

export function FileManager({ defaultCollapsed = true }: FileManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("organize");

  return (
    <CollapsibleCard title="File Manager" defaultCollapsed={defaultCollapsed}>
      {/* Tab Bar */}
      <div className="flex gap-1 mb-4 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="min-h-[200px]">
        {activeTab === "organize" && <OrganizePanel />}
        {activeTab === "rename" && <RenamePanel />}
        {activeTab === "clean" && <CleanPanel />}
        {activeTab === "index" && <IndexPanel />}
        {activeTab === "dupes" && <DupesPanel />}
        {activeTab === "undo" && <UndoPanel />}
      </div>
    </CollapsibleCard>
  );
}
